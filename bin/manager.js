import fetch from "node-fetch";
import chalk from "chalk";
import { Mod } from "./mod.js";
import { getConfigValue } from "./config.js";
import { loadMods } from "./utils.js";

export function installModrinthMod(modID){
	// check if the mod is already installed
	let existingMod = getConfigValue("mods").find((mod) => mod.slug == modID.toLowerCase() || mod.id == modID)
	if(existingMod){
		console.log(chalk.red("Error: ") + `${existingMod.title} is already installed.`);
		return;
	}

	fetch(`https://api.modrinth.com/v2/project/${modID}`)
	.then(res => res.text())
	.then(async data => {
		try{
			data = JSON.parse(data);
		}catch(e){
			console.log(chalk.red("Error: ") + "Something went wrong, Mod ID may be invalid.");
			return;
		}

		let mod = new Mod("Modrinth", data.slug, data.id, data.title);
		
		// update and install the mod
		let index = await mod.updateVersion()
		mod.swapVersion(index);
	});
}

export function installCurseForgeMod(modID){
	
}

export function triggerModFunction(query, functionName){
	let mods = loadMods();

	// trigger on all mods if query is "all"
	if(query.toLowerCase() == "all"){
		for(let mod of mods){
			mod[functionName]();
		}
		return;
	}
	
	let mod = mods.find((mod) => mod.slug == query.toLowerCase() || mod.id == query);

	if(!mod){
		console.log(chalk.red("Error: ") + "Mod not found.");
		return;
	}

	mod[functionName]();
}