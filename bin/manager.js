import chalk from "chalk";
import { getConfigValue } from "./config.js";
import { loadMods } from "./utils.js";
import { curseforge } from "./moddbs/curseforge.js";
import { modrinth } from "./moddbs/modrinth.js";
import { inquirer } from "./index.js";

export async function installModrinthMod(modID){
	// check if the mod is already installed
	let existingMod = getConfigValue("mods").find((mod) => mod.slug == modID.toLowerCase() || mod.id == modID)
	if(existingMod){
		console.log(chalk.red("Error: ") + `${existingMod.title} is already installed.`);
		return;
	}

	let mod = await modrinth.getMod(modID);
	// update and install the mod
	let index = await mod.updateVersion()
	mod.swapVersion(index);
}

export async function installCurseForgeMod(modID){
	// check if the mod is already installed
	let existingMod = getConfigValue("mods").find((mod) => mod.slug == modID.toLowerCase() || mod.id == modID)
	if(existingMod){
		console.log(chalk.red("Error: ") + `${existingMod.title} is already installed.`);
		return;
	}

	let mod = await curseforge.getMod(modID);

	// install and update the mod
	let index = await mod.updateVersion();
	mod.swapVersion(index);
}

export async function searchAllPlatforms(modID){
	// check if the mod is already installed
	let existingMod = getConfigValue("mods").find((mod) => mod.slug == modID.toLowerCase() || mod.id == modID)
	if(existingMod){
		console.log(chalk.red("Error: ") + `${existingMod.title} is already installed.`);
		return;	
	}
	let mrMod = await modrinth.getMod(modID, true);
	let cfMod = await curseforge.getMod(modID, true);
	let mod;

	if(!mrMod && !cfMod){
		console.log(chalk.red("Error: ") + "Mod not found.");
		return;
	}

	if(mrMod && cfMod){
		let res = await inquirer.prompt([
			{
				type: "list",
				name: "mod",
				message: "Which platform would you like to install this mod from?",
				choices: [
					{
						name: "Modrinth (recommended)",
						value: "modrinth"
					},
					{
						name: "CurseForge",
						value: "curseforge"
					}
				]
			}
		])

		if(res.mod == "modrinth"){
			mod = mrMod;
		}else{
			mod = cfMod;
		}
	}else{
		// if only one mod is found, install it
		if(mrMod){
			console.log(chalk.green("Installing mod from Modrinth"));
			mod = mrMod;
		}else{
			console.log(chalk.green("Installing mod from CurseForge"));
			mod = cfMod;
		}
	}

	// install and update the mod
	let index = await mod.updateVersion();
	mod.swapVersion(index);
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