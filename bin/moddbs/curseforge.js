import {CurseForgeClient, CurseForgeGameEnum, CurseForgeModLoaderType} from 'curseforge-api';
import { getAPIKey } from '../config.js';
import chalk from 'chalk';
import fetch from "node-fetch";
import { Mod } from '../mod.js';

export var curseforge = {
	names: [
		"curseforge",
		"cf",
		"c"
	],
	async getVersion(mod, gameVersion, loader){
		let curseforgeKey = getAPIKey("curseforge");
		if(!curseforgeKey){
			console.log(chalk.red("You need to add a curseforge api key with 'fmm key' before you can download mods"));
			return;
		}
		var client = new CurseForgeClient(curseforgeKey, {fetch});

		let loaderID;
		switch(loader.toLowerCase()){
			case "fabric":
				loaderID = CurseForgeModLoaderType.Fabric;
				break;
			case "forge":
				loaderID = CurseForgeModLoaderType.Forge;
				break;
			case "quilt":
				loaderID = CurseForgeModLoaderType.Quilt;
				break;
		}

		const remoteMod = await client.getMod(mod.id);
		const files = await remoteMod.getFiles(mod.id, {
			gameVersion: gameVersion,
			modLoaderType: loaderID
		})

		// find a file that matches the game version
		let file = files.data.find((file) => file.gameVersions.includes(gameVersion));
		if(!file){
			console.log(chalk.red("Error: ") + "No file found for " + gameVersion + " with " + loader + " loader.");
			return null;
		}

		return {
			url: file.downloadUrl,
			fileName: file.fileName,
			game_versions: file.sortableGameVersions.filter(v => v.gameVersion != '').map(v => v.gameVersion),
			
		}
	},
	async getMod(modID, hideErrors){
		let curseforgeKey = getAPIKey("curseforge");
		if(!curseforgeKey){
			console.log(chalk.red("You need to add a curseforge api key with 'fmm key' before you can download mods"));
			return;
		}
		var client = new CurseForgeClient(curseforgeKey, {fetch});

		let modData;
		if(isNaN(parseInt(modID))){
			// the modID is a slug
			var modResults = await client.searchMods(CurseForgeGameEnum.Minecraft, {slug: modID});
			// remove any modpacks
			modResults = modResults.data.filter(m => !m.links.websiteUrl.includes("/modpacks/"))
			if(modResults.length == 0){
				if(!hideErrors) console.log(chalk.red("Error: ") + "Mod not found.");
				return;
			}
			modData = modResults[0];
		}else{
			try {
				modData = await client.getMod(modID);
			}catch(e){
				if(!hideErrors) console.log(chalk.red("Error: ") + "Mod not found.");
				return;
			}
		}

		if(!modData){
			if(!hideErrors) console.log(chalk.red("Error: ") + "Mod not found.");
			return;
		}
		
		let mod = new Mod("Curseforge", modData.slug, modData.id, modData.name);
		return mod;
	}
}