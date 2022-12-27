import fetch from "node-fetch";
import { getConfigValue, setConfigValue, updateMod } from "./config.js";
import chalk from "chalk";
import fs from 'fs';
import { confirmUnusedExists } from "./utils.js";
import { modrinth } from "./moddbs/modrinth.js";
import { curseforge } from "./moddbs/curseforge.js";

export class Mod{
	constructor(site, slug, id, title){
		this.site = site
		this.slug = slug
		this.id = id
		this.title = title
		this.activeVersionIndex = null
		this.disabled = false

		this.versions = []
	}

	get activeVersion(){
		if(this.activeVersionIndex == null) return null;
		return this.versions[this.activeVersionIndex];
	}

	async updateVersion(){
		const gameVersion = getConfigValue("version");

		if(!gameVersion){
			console.log(chalk.red("Error: ") + "No Minecraft version set. You can set the minecraft version with 'fmm version -v <version>'");
			return null;
		}
		// check if we already have a version for this game version
		let existingIndex = this.versions.findIndex((version) => version.game_versions.includes(gameVersion));
		if(existingIndex != -1){
			return existingIndex;
		}

		let version;
		switch(this.site.toLowerCase()){
			case "modrinth":
				version = await modrinth.getVersion(this, gameVersion);
				break;
			case "curseforge":
				version = await curseforge.getVersion(this, gameVersion);
		}

		// add the version to the versions array without the dependencies
		this.versions.push(version);

		updateMod(this);
		
		return this.versions.length - 1;
	}

	async installVersion(force){
		if(!this.activeVersion) return;
		const modDir = getConfigValue("modDir");

		// make sure the mod directory exists
		if(modDir == null){
			console.log(chalk.red("Error: ") + "Mod directory not set. Use 'fmm moddir -p <path>' to set it.");
			return;
		}

		confirmUnusedExists();

		// check if the mod is already installed
		let unusedExists = fs.existsSync(modDir + "\\fmm_unused\\" + this.activeVersion.fileName);
		let usedExists = fs.existsSync(modDir + "\\" + this.activeVersion.fileName)
		if(unusedExists || usedExists){
			if(force){
				// delete it if force is enabled
				if(unusedExists) fs.rmSync(modDir + "\\fmm_unused\\" + this.activeVersion.fileName);
				if(usedExists) fs.rmSync(modDir + "\\" + this.activeVersion.fileName);
			}else{
				return;
			}
		}

		// download the mod
		let data = await fetch(this.activeVersion.url)
		const dest = fs.createWriteStream(modDir + "\\fmm_unused\\" + this.activeVersion.fileName);
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
		confirmUnusedExists();

		// swap out the old file, if it exists
		const modDir = getConfigValue("modDir");
		if(modDir == null){
			console.log(chalk.red("Error: ") + "Mod directory not set. Use 'fmm moddir -p <path>' to set it.");
			return;
		}

		if(this.activeVersion){
			if(fs.existsSync(modDir + "\\" + this.activeVersion.fileName)){
				// move the old file to the unused folder
				fs.renameSync(modDir + "\\" + this.activeVersion.fileName, modDir + "\\fmm_unused\\" + this.activeVersion.fileName);
			}
		}

		// swap in the version we want
		this.activeVersionIndex = index;

		if(fs.existsSync(modDir + "\\fmm_unused\\" + this.activeVersion.fileName)){
			fs.renameSync(modDir + "\\fmm_unused\\" + this.activeVersion.fileName, modDir + "\\" + this.activeVersion.fileName);
		}else{
			// install the version and then swap it in`
			await this.installVersion(true);
			this.swapVersion(index);
		}

		// update the config file
		updateMod(this);
	}

	delete(){
		const modDir = getConfigValue("modDir");
		if(modDir == null){
			console.log(chalk.red("Error: ") + "Mod directory not set. Use 'fmm moddir -p <path>' to set it.");
			return;
		}

		// delete the mod's files for all versions
		for(let version of this.versions){
			// check whether the version is active
			if(version == this.activeVersion){
				// delete the active version
				if(fs.existsSync(modDir + "\\" + version.fileName)){
					fs.rmSync(modDir + "\\" + version.fileName);
				}
			}else{
				// delete the inactive version
				if(fs.existsSync(modDir + "\\fmm_unused\\" + version.fileName)){
					fs.rmSync(modDir + "\\fmm_unused\\" + version.fileName);
				}
			}
		}

		// remove the mod from the config file
		let mods = getConfigValue("mods");
		if(mods == null) return;
		let index = mods.findIndex((mod) => mod.id == this.id);
		if(index == -1) return;
		mods.splice(index, 1);
		setConfigValue("mods", mods);

		console.log(chalk.green("Success: ") + `${this.title} deleted successfully.`);
	}

	disable(){
		confirmUnusedExists();
		const modDir = getConfigValue("modDir");
		if(modDir == null){
			console.log(chalk.red("Error: ") + "Mod directory not set. Use 'fmm moddir -p <path>' to set it.");
			return;
		}

		// move the active version to the unused folder
		if(this.activeVersion){
			if(fs.existsSync(modDir + "\\" + this.activeVersion.fileName)){
				fs.renameSync(modDir + "\\" + this.activeVersion.fileName,
				modDir + "\\fmm_unused\\" + this.activeVersion.fileName);
			}
		}

		this.disabled = true;

		// update the config file
		updateMod(this);
	}

	enable(){
		const modDir = getConfigValue("modDir");
		const version = getConfigValue("version");
		if(modDir == null){
			console.log(chalk.red("Error: ") + "Mod directory not set. Use 'fmm moddir -p <path>' to set it.");
			return;
		}

		this.disabled = false;

		// swap in a version that is compatible with the current game version
		let index = this.versions.findIndex((modVer) => modVer.game_versions.includes(version));
		if(index == -1) return;
		this.swapVersion(index);
	}
}