import { config } from "./config.js";
import { Mod } from "./mod.js";
import fs from 'fs';
import chalk from "chalk";
import { join } from "path";

export function loadMods(){
	let mods = config.getConfigValue("mods") ?? [];
	let modList = [];
	for(let mod of mods){
		let newMod = new Mod(mod.site, mod.slug, mod.id, mod.title);
		
		newMod.versions = mod.versions;
		newMod.activeVersionIndex = mod.activeVersionIndex;

		modList.push(newMod);
	}
	return modList;
}

export function confirmUnusedExists(){
	let modDir = config.getConfigValue("modDir");
	if(!modDir){
		console.log(chalk.red("Error: ") + "Mod directory not set. You can set it with 'fmm moddir -p <path>'");
		return null;
	}
	fs.existsSync(join(modDir, "fmm_unused")) || fs.mkdirSync(join(modDir + "fmm_unused"));
	return modDir;
}