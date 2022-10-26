import fs from 'fs';
import { getConfigValue } from './config.js';

export function getFabricVersions(){
	let versions = fs.readdirSync(getConfigValue("modDir").split("\\").slice(0, -1).join("\\") + "\\versions")
	versions = versions.filter((version) => version.includes("fabric-loader"));
	versions = versions.map((version) => version.split("-")[3]);
	// remove repeated versions
	versions = versions.filter((version, index) => versions.indexOf(version) === index);
	return versions;
}