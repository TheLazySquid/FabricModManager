import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join} from 'path';
import { Profile } from './profile.js';
import chalk from 'chalk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configFile = join(__dirname, "../") + "\\fmmconfig.json";

const defaultConfigValues = {
	loader: "fabric",
	mods: []
}

export let config = {
	configSave: null,
	get activeProfile(){
		let index = this.getConfigValue("activeProfileIndex")
		
		// if no active profile is set, return null
		let profiles = this.getConfigValue("profiles");
		if(!profiles) return null;

		if(index == null || index >= profiles.length) return null;
		
		// return the active profile
		let profile = profiles[index];
		let profileObj = new Profile(profile.name, profile.version, profile.loader);
		profileObj.mods = profile.mods;

		this.activeProfileSave = profileObj;
		return profileObj;
	},
	loadProfiles(){
		let profiles = this.getConfigValue("profiles");
		if(!profiles) return [];
		return profiles.map(p => {
			let profile = new Profile(p.name, p.version, p.loader);
			profile.mods = p.mods;
			return profile;
		})
	},
	getConfig(){
		if(this.configSave) return this.configSave;
		if(!fs.existsSync(configFile)) return {};
		const config = fs.readFileSync(configFile, 'utf8') || "{}";
		this.configSave = JSON.parse(config);
		return this.configSave;
	},
	getConfigValue(key){
		let config = this.getConfig();	
		return config[key] ?? (defaultConfigValues[key] ?? null);
	},
	setConfigValue(key, value){
		let config = this.getConfig();
		config[key] = value;
		fs.writeFileSync(configFile, JSON.stringify(config, null, 4));
	},
	updateMod(mod){
		var mods = this.getConfigValue("mods");
		if(!mods) mods = [];
	
		// check if the mod is already in the config
		let modIndex = mods.findIndex((m) => m.id == mod.id);
		if(modIndex != -1){
			// overwrite the mod
			mods[modIndex] = mod;
		}else{
			// add the mod
			mods.push(mod);
		}
	
		// save the mods
		this.setConfigValue("mods", mods);
	},
	setAPIKey(site, key){
		var keys = this.getConfigValue("keys");
		if(!keys) keys = {};
	
		keys[site] = key;
		this.setConfigValue("keys", keys);
	
		console.log(chalk.green(`${site} API key successfully updated to ${key}`))
	},
	getAPIKey(site){
		var keys = this.getConfigValue("keys");
		if(!keys) keys = {};
	
		return keys[site] ?? null;
	},
	updateProfile(profile, customName = null){
		var profiles = this.getConfigValue("profiles");
		if(!profiles) profiles = [];

		// check if the profile is already in the config
		let profileIndex = profiles.findIndex((p) => p.name == (customName ?? profile.name));
		if(profileIndex != -1){
			// overwrite the profile
			profiles[profileIndex] = profile;
		}else{
			// add the profile
			profiles.push(profile);
		}

		// save the profiles
		this.setConfigValue("profiles", profiles);
	},
	createProfile(name, version, loader){
		let profiles = config.getConfigValue("profiles");
		if(!profiles) profiles = [];
	
		if(profiles.find((profile) => profile.name == name)){
			console.log(chalk.red("Error: ") + "Profile already exists.");
			return;
		}
	
		profiles.push({
			name: name,
			mods: [],
			version: version ?? null,
			loader: loader ?? null
		})
	
		// save the profile
		this.setConfigValue("profiles", profiles);
	
		// set this profile as the active profile
		this.setConfigValue("activeProfileIndex", profiles.length - 1);
		console.log(chalk.green("Profile created successfully."));
	},
	switchProfile(name){
		let profiles = this.getConfigValue("profiles");
		if(!profiles) profiles = [];
	
		let profileIndex = profiles.findIndex((profile) => profile.name == name);
		if(profileIndex == -1){
			console.log(chalk.red("Error: ") + "Profile does not exist.");
			return;
		}
	
		// disable the active profile
		this.activeProfile.disable();
		
		this.setConfigValue("activeProfileIndex", profileIndex);
		
		// enable the new profile
		this.activeProfile.enable();
		console.log(chalk.green("Profile successfully switched."));
	},
	deleteProfile(name){
		let profiles = this.getConfigValue("profiles");
		if(!profiles) profiles = [];
	
		let profileIndex = profiles.findIndex((profile) => profile.name == name);
		if(profileIndex == -1){
			console.log(chalk.red("Error: ") + "Profile does not exist.");
			return;
		}
	
		// remove the profile
		profiles.splice(profileIndex, 1);
	
		// save the profiles
		this.setConfigValue("profiles", profiles);
	
		// if the deleted profile was the active profile, swap to the first profile
		if(profiles.length > 0){
			if(profileIndex == this.getConfigValue("activeProfileIndex")){
				this.setConfigValue("activeProfileIndex", 0);
			}
			console.log("Switched to profile " + profiles[0]?.name);
		}else{
			this.setConfigValue("activeProfileIndex", null);
			console.log("No profiles left.");
		}
	}
}
