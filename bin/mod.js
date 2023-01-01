import fetch from "node-fetch";
import { config } from "./config.js";
import chalk from "chalk";
import fs from 'fs';
import { confirmUnusedExists } from "./utils.js";
import { modrinth } from "./moddbs/modrinth.js";
import { curseforge } from "./moddbs/curseforge.js";
import { join } from "path";

export class Mod{
	constructor(site, slug, id, title){
		this.site = site
		this.slug = slug
		this.id = id
		this.title = title
		this.disabled = false
		this.activeVersionIndex = null
		this.manuallyAdded = false

		this.versions = []
	}

	get activeVersion(){
		if(this.activeVersionIndex == null) return null;
		return this.versions[this.activeVersionIndex];
	}

	async updateVersion(){
		const gameVersion = config.activeProfile.version;
		const loader = config.activeProfile.loader;

		if(!gameVersion){
			console.log(chalk.red("Error: ") + "No Minecraft version set. You can set the minecraft version with 'fmm version <version>'");
			return null;
		}
		// check if we already have a version for this game version and loader
		let existingIndex = this.versions.findIndex((version) => version.game_versions.includes(gameVersion)
		&& version.loader == loader);
		if(existingIndex != -1){
			return existingIndex;
		}
		
		// don't try to update a manually added mod
		if(this.manuallyAdded) return null;

		let version;
		switch(this.site.toLowerCase()){
			case "modrinth":
				version = await modrinth.getVersion(this, gameVersion, loader);
				break;
			case "curseforge":
				version = await curseforge.getVersion(this, gameVersion, loader);
		}
		if(!version){
			return null;
		}

		// add the version to the versions array without the dependencies
		this.versions.push(version);

		config.updateMod(this);
		
		return this.versions.length - 1;
	}

	async installVersion(force){
		if(!this.activeVersion) return;
		if(this.manuallyAdded) return null;
		const modDir = config.getConfigValue("modDir");

		// make sure the mod directory exists
		if(modDir == null){
			console.log(chalk.red("Error: ") + "Mod directory not set. Use 'fmm moddir -p <path>' to set it.");
			return;
		}

		confirmUnusedExists();

		// check if the mod is already installed
		let unusedExists = fs.existsSync(join(modDir, "fmm_unused", this.activeVersion.fileName));
		let usedExists = fs.existsSync(join(modDir, this.activeVersion.fileName))
		if(unusedExists || usedExists){
			if(force){
				// delete it if force is enabled
				if(unusedExists) fs.rmSync(join(modDir, "fmm_unused", this.activeVersion.fileName));
				if(usedExists) fs.rmSync(join(modDir, this.activeVersion.fileName));
			}else{
				return;
			}
		}

		// download the mod
		let data = await fetch(this.activeVersion.url)
		const dest = fs.createWriteStream(join(modDir, "fmm_unused", this.activeVersion.fileName));
		data.body.pipe(dest);

		// the above doesn't run synchronously, so we need to wait for the file to be written
		await new Promise((resolve, reject) => {
			dest.on("finish", () => {
				resolve();
			})
			dest.on("error", () => {
				reject();
			})
		})

		console.log(chalk.green("Success: ") + `${this.title} installed successfully.`);
	}

	async swapVersion(index){
		if(this.disabled){
			// just don't
			return;
		}

		if(index >= this.versions.length){
			console.log(chalk.red("Error: ") + "Invalid version index.");
			return;
		}

		// make sure the mod directory exists
		if(!confirmUnusedExists()) return;

		// swap out the old file, if it exists
		const modDir = config.getConfigValue("modDir");
		if(modDir == null){
			console.log(chalk.red("Error: ") + "Mod directory not set. Use 'fmm moddir -p <path>' to set it.");
			return;
		}

		if(this.activeVersion){
			if(fs.existsSync(join(modDir, this.activeVersion.fileName))){
				// move the old file to the unused folder
				fs.renameSync(join(modDir, this.activeVersion.fileName), join(modDir, "fmm_unused", this.activeVersion.fileName));
			}
		}

		// swap in the version we want
		this.activeVersionIndex = index;
		if(index == null) return;

		if(fs.existsSync(join(modDir, "fmm_unused", this.activeVersion.fileName))){
			fs.renameSync(join(modDir, "fmm_unused", this.activeVersion.fileName), join(modDir, this.activeVersion.fileName));
		}else{
			// install the version and then swap it in
			await this.installVersion(true);
			this.swapVersion(index);
		}

		// update the config file
		config.updateMod(this);
	}

	delete(){
		const modDir = config.getConfigValue("modDir");
		if(modDir == null){
			console.log(chalk.red("Error: ") + "Mod directory not set. Use 'fmm moddir -p <path>' to set it.");
			return;
		}

		// check if the mod is being used in any inactive profiles
		let profiles = config.loadProfiles();
		let activeProfileIndex = config.getConfigValue("activeProfileIndex");
		let usedInInactiveProfile = false;
		for(let i = 0; i < profiles.length; i++){
			if(i == activeProfileIndex) continue;
			let profile = profiles[i];
			for(let mod of profile.mods){
				if(mod.id == this.id){
					usedInInactiveProfile = true;
					break;
				}
			}
		}

		// remove this from the active profile
		config.activeProfile.removeMod(this);

		if(!usedInInactiveProfile){
			// delete the mod's files for all versions
			for(let version of this.versions){
				// check whether the version is active
				if(version == this.activeVersion){
					// delete the active version
					if(fs.existsSync(join(modDir, version.fileName))){
						fs.rmSync(join(modDir, version.fileName));
					}
				}else{
					// delete the inactive version
					if(fs.existsSync(join(modDir, "fmm_unused", version.fileName))){
						fs.rmSync(join(modDir, "fmm_unused", version.fileName));
					}
				}
			}
			// remove the mod from the config file
			let mods = config.getConfigValue("mods");
			if(mods == null) return;
			let index = mods.findIndex((mod) => mod.id == this.id);
			if(index == -1) return;
			mods.splice(index, 1);
			config.setConfigValue("mods", mods);
		}else{
			// just move the active version to the unused folder
			if(this.activeVersion){
				if(fs.existsSync(join(modDir, this.activeVersion.fileName))){
					fs.renameSync(join(modDir, this.activeVersion.fileName),
					join(modDir, "fmm_unused", this.activeVersion.fileName));
				}
			}
		}

		console.log(chalk.green("Success: ") + `${this.title} deleted successfully.`);
	}

	disable(){
		const modDir = config.getConfigValue("modDir");
		if(modDir == null){
			console.log(chalk.red("Error: ") + "Mod directory not set. Use 'fmm moddir -p <path>' to set it.");
			return;
		}
		confirmUnusedExists();

		// move the active version to the unused folder
		if(this.activeVersion){
			if(fs.existsSync(join(modDir, this.activeVersion.fileName))){
				fs.renameSync(join(modDir, this.activeVersion.fileName),
				join(modDir, "fmm_unused", this.activeVersion.fileName));
			}
		}

		this.disabled = true;

		// update the config file
		config.updateMod(this);
	}

	enable(){
		const modDir = config.getConfigValue("modDir");
		const version = config.activeProfile.version;
		const loader = config.activeProfile.loader;
		if(modDir == null){
			console.log(chalk.red("Error: ") + "Mod directory not set. Use 'fmm moddir -p <path>' to set it.");
			return;
		}

		this.disabled = false;

		// swap in a version that is compatible with the current game version and loader
		let index = this.versions.findIndex((modVer) => modVer.game_versions.includes(version) && 
			modVer.loader == loader);
		if(index == -1) return;
		this.swapVersion(index);
	}

	async reinstall(){
		await this.swapVersion(this.activeVersionIndex);
		console.log(chalk.green("Success: ") + `${this.title} reinstalled successfully.`);
	}
}