import fs from 'fs';
import { setConfigValue, getConfigValue } from './config.js';
import chalk from 'chalk';
import { downloadMod } from './downloadmod.js';

export async function updateMods(version){
	if(getConfigValue("version") == version) return console.log(chalk.yellow("Nothing changed. Already using that version."));
	let modDir = getConfigValue("modDir");

	if(!fs.existsSync(`${modDir}\\fmm-unused`)){
		fs.mkdirSync(`${modDir}\\fmm-unused`);
	}
	
	setConfigValue({fabricVersion: version});

	let mods = getConfigValue("mods");
	for(let mod of mods){
		mod.altversions = mod.altversions || [];

		// move old mod to old folder
		if(fs.existsSync(`${modDir}\\${mod.fileName}`)){
			fs.renameSync(`${modDir}\\${mod.fileName}`, `${modDir}\\fmm-unused\\${mod.fileName}`);
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
			if(fs.existsSync(`${modDir}\\fmm-unused\\${swapInMod.fileName}`)){
				fs.renameSync(`${modDir}\\fmm-unused\\${swapInMod.fileName}`, `${modDir}\\${swapInMod.fileName}`);
				mod.version = swapInMod.version;
				mod.fileName = swapInMod.fileName;	
			}else{
				console.log(chalk.yellow(`Could not find ${swapInMod.fileName} in the unused mods folder.`));
			}
			mod.altversions.splice(swapInModIndex, 1);
		}else{
			await downloadMod(mod.modID, {modName: mod.modName, modsObject: mods});
		}
	}
	console.log(mods)
	setConfigValue({mods});
}

export async function updateModDir(directory){
	if(!fs.existsSync(directory)) return console.log(chalk.red("That directory does not exist."));
	// move old mods to new folder
	if(!fs.existsSync(`${directory}\\fmm-unused`)){
		fs.mkdirSync(`${directory}\\fmm-unused`);
	}
	let mods = getConfigValue("mods");
	let oldModDir = getConfigValue("modDir");
	for(let mod of mods){
		if(fs.existsSync(`${oldModDir}\\${mod.fileName}`)){
			fs.renameSync(`${oldModDir}\\${mod.fileName}`, `${directory}\\${mod.fileName}`);
		}
		for(let alt of mod.altversions){
			if(fs.existsSync(`${oldModDir}\\fmm-unused\\${alt.fileName}`)){
				fs.renameSync(`${oldModDir}\\fmm-unused\\${alt.fileName}`, `${directory}\\fmm-unused\\${alt.fileName}`);
			}
		}
	}
	setConfigValue({modDir: directory});
	console.log(chalk.green("Moved old mods to new folder."));
}