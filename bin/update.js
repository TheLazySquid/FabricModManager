import fs from 'fs';
import { setConfigValue, getConfigValue } from './config.js';
import chalk from 'chalk';
import { downloadMod } from './downloadmod.js';

export async function updateMods(version){
	if(getConfigValue("version") == version) return console.log(chalk.yellow("Nothing changed. Already using that version."));

	if(!fs.existsSync(`${getConfigValue("modDir")}\\fmm-unused`)){
		fs.mkdirSync(`${getConfigValue("modDir")}\\fmm-unused`);
	}
	
	setConfigValue({fabricVersion: version});

	let mods = getConfigValue("mods");
	for(let mod of mods){
		mod.altversions = mod.altversions || [];

		// move old mod to old folder
		if(fs.existsSync(`${getConfigValue("modDir")}\\${mod.fileName}`)){
			fs.renameSync(`${getConfigValue("modDir")}\\${mod.fileName}`, `${getConfigValue("modDir")}\\fmm-unused\\${mod.fileName}`);
			mod.altversions.push({version: mod.version, fileName: mod.fileName});
		}else{
			if(mod.version != null) console.log(chalk.yellow(`Could not find ${mod.modName} in the mods folder.`));
		}
		mod.version = null;
		mod.fileName = null;

		// check if the mod for the new version exists
		let swapInModIndex = mod.altversions.findIndex(v => v.version == version);
		let swapInMod = mod.altversions[swapInModIndex];
		if(swapInMod){
			// move the mod to the mods folder
			if(fs.existsSync(`${getConfigValue("modDir")}\\fmm-unused\\${swapInMod.fileName}`)){
				fs.renameSync(`${getConfigValue("modDir")}\\fmm-unused\\${swapInMod.fileName}`, `${getConfigValue("modDir")}\\${swapInMod.fileName}`);
				mod.version = swapInMod.version;
				mod.fileName = swapInMod.fileName;	
			}else{
				console.log(chalk.yellow(`Could not find ${swapInMod.fileName} in the unused mods folder.`));
			}
			mod.altversions.splice(swapInModIndex, 1);
		}else{
			setConfigValue({mods});
			await downloadMod(mod.modID, mod.modName);
			mods = getConfigValue("mods");
		}
	}
	setConfigValue({mods});
}