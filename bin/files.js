import fs from 'fs';
import { getConfigValue } from './config.js';
import chalk from 'chalk';

export function getFabricVersions(){
	const versionPath = getConfigValue("modDir").split("\\").slice(0, -1).join("\\") + "\\versions"
	if(!fs.existsSync(versionPath)){
		console.log(chalk.red("Could not find versions folder!"));
		return [];
	}
	let versions = fs.readdirSync(versionPath)
	versions = versions.filter((version) => version.includes("fabric-loader"));
	versions = versions.map((version) => version.split("-")[3]);
	// remove repeated versions
	versions = versions.filter((version, index) => versions.indexOf(version) === index);
	return versions;
}