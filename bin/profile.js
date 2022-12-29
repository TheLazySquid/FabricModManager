import chalk from "chalk";
import { config } from "./config.js";
import { Mod } from "./mod.js";1

export class Profile{
	constructor(name, version, loader){
		this.name = name;
		this.version = version;
		this.loader = loader ?? "fabric";
		this.mods = [];
	}
	addMod(mod){
		this.mods.push({
			id: mod.id,
			disabled: false
		})
		config.updateProfile(this);
	}
	removeMod(mod){
		this.mods = this.mods.filter(m => m.id != mod.id);
		config.updateProfile(this);
	}
	setConfigValue(key, value){
		this[key] = value;
		config.updateProfile(this);
	}
	loadMods(){
		let mods = this.mods ?? [];
		let allMods = config.getConfigValue("mods");
		mods = mods.map(mod => {
			// find the mod in the config
			return allMods.find(m => m.id == mod.id);
		})
		let modList = [];
		for(let mod of mods){
			let newMod = new Mod(mod.site, mod.slug, mod.id, mod.title);
			
			newMod.versions = mod.versions;
			newMod.activeVersionIndex = mod.activeVersionIndex;
			newMod.disabled = mod.disabled;

			mod.disabledOnThisProfile = this.mods.find(m => m.id == mod.id).disabled;

			modList.push(newMod);
		}
		return modList;
	}
	disable(){
		for(let mod of this.loadMods()){
			mod.disable()
		}
	}
	enable(){
		for(let mod of this.loadMods()){
			if(mod.disabledOnThisProfile) continue;
			mod.disabled = false;
			config.updateMod(mod);

			// swap in the version that this profile uses
			let versionIndex = mod.versions.findIndex(v => v.game_versions.includes(this.version) && v.loader == this.loader);
			mod.swapVersion(versionIndex);
		}
	}
	disableMod(query){
		if(query == "all"){
			for(let mod of this.mods){
				this.disableMod(mod.id);
			}
		}else{
			let mods = this.loadMods();
			let mod = mods.find(m => m.id == query || m.slug == query);
			if(!mod) return;
			mod.disable();
			// disable the mod in the profile
			this.mods.find(m => m.id == mod.id).disabled = true;

			console.log(chalk.green(`Disabled ${mod.title}`));
		}

		config.updateProfile(this);
	}
	enableMod(query){
		if(query == "all"){
			for(let mod of this.mods){
				this.enableMod(mod.id);
			}
		}else{
			let mods = this.loadMods();
			let mod = mods.find(m => m.id == query || m.slug == query);
			if(!mod) return;
			mod.enable();
			// enable the mod in the profile
			this.mods.find(m => m.id == mod.id).disabled = false;

			console.log(chalk.green(`Enabled ${mod.title}`));
		}

		config.updateProfile(this);
	}
	triggerModFunction(query, funcName){
		if(query == "all") return this.loadMods().forEach(m => m[funcName]())
		let mods = this.loadMods();
		let mod = mods.find(m => m.id == query || m.slug == query);
		if(!mod) return;
		mod[funcName]();
		config.updateMod(mod);
	}
}