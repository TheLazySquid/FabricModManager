import { inquirer } from "./../index.js";
import fetch from "node-fetch";
import { config } from "./../config.js";
import chalk from "chalk";
import { installModrinthMod } from "../manager.js";
import { Mod } from "../mod.js";

export let modrinth = {
	names: [
		"modrinth",
		"mr",
		"m"
	],
	async getVersion(mod, gameVersion, loader){
		// get the mod's versions
		let res = await fetch(`https://api.modrinth.com/v2/project/${mod.id}/version`)
		let data = await res.text()
		try{
			data = JSON.parse(data);
		}catch(e){
			console.log(chalk.red("Error: ") + `Something went wrong getting the versions for ${mod.title}.`);
			return null;
		}

		// only show versions for the correct modloader
		data = data.filter((version) => version.loaders.includes(loader));

		// find a compatible version
		let versionIndex = data.findIndex((version) => version.game_versions.includes(gameVersion));
		if(versionIndex == -1){
			console.log(chalk.red("Error: ") + "No version found for " + gameVersion + " with " + loader + " loader.");
			return null;
		}

		let version = data[versionIndex];

		// install any dependencies
		if(version.dependencies.length > 0){
			let mods = config.getConfigValue("mods");
			let res = await fetch(`https://api.modrinth.com/v2/project/${mod.id}/dependencies`)
			let data = await res.text()
			try{
				data = JSON.parse(data);
			}catch(e){
				console.log(chalk.red("Error: ") + `Something went wrong getting the dependencies for ${mod.title}.`);
				return null;
			}
			
			// make a checklist so that the user can select which dependencies to install
			let choices = data.projects.map((dependency) => {
				let dependencyIndex = version.dependencies.findIndex((dep) => dep.project_id == dependency.id);
				if(dependencyIndex == -1) return null;
				let dep = version.dependencies[dependencyIndex];
				let dep_type = dep.dependency_type;
				// remove dependencies that are already installed
				let depInstalled = mods.findIndex((mod) => mod.id == dependency.id) != -1;
				if(depInstalled) return null;
				return {
					name: dependency.title + ` (${dep_type})`,
					value: dependency.id,
					checked: dep_type != "optional"
				}
			})
			// remove null values
			choices = choices.filter((choice) => choice != null);

			let answers = await inquirer.prompt([
				{
					type: "checkbox",
					name: "dependencies",
					message: `Select dependencies to install for ${mod.title}`,
					choices
				}
			])

			// install the dependencies
			for(let dependency of answers.dependencies){
				installModrinthMod(dependency);
			}
		}

		return {
			game_versions: version.game_versions,
			fileName: version.files[0].filename,
			url: version.files[0].url,
			loader: loader.toLowerCase()
		};
	},
	async getMod(modID, hideErrors){
		let res = await fetch(`https://api.modrinth.com/v2/project/${modID}`)
		let data = await res.text();
		try{
			data = JSON.parse(data);
		}catch(e){
			if(!hideErrors) console.log(chalk.red("Error: ") + "Something went wrong, Mod ID may be invalid.");
			return;
		}
		let mod = new Mod("Modrinth", data.slug, data.id, data.title);
		return mod;
	},
	async search(query){
		let res = await fetch(`https://api.modrinth.com/v2/search?query=${query}&type=mod`)
		let data = await res.text()
		try{
			data = JSON.parse(data);
		}catch(e){
			if(!hideErrors) console.log(chalk.red("Error: ") + "Something went wrong searching for mods.");
			return null;
		}
		let hits = data.hits.map(hit => {
			return {
				id: hit.id,
				slug: hit.slug,
				title: hit.title
			}
		})

		return hits;
	}
}