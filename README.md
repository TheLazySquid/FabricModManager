# Fabric Mod Manager

Fabric Mod manager is a command line tool to install, update and otherwise manage mods for the Fabric mod loader. For now, it only supports the Modrinth mod repository, but support for other repositories (especially CurseForge) will be added in the future.

## Installation

To install FMM, you can download or clone this reposiory. Then, open a terminal inside the directory and run `npm i -g .` to install it globally.

## Setup

To get started using FMM, you need to set the directory where mods will be downloaded to. This will probably look like

`fmm moddir -p "C:\Users\<name>\AppData\Roaming\.minecraft\mods"`

You can then start installing mods with `fmm install`

## Commands

### `fmm install -q <modID/slug>`

Installs a mod from Modrinth with it's ID or slug. An example of this command would look like this:

```bash
fmm install -q no-chat-reports
```

### `fmm uninstall -q <modID/slug>`

Uninstalls a mod, and deletes it's files. An example of this command would look like this:

```bash
fmm uninstall -q no-chat-reports
```

### `fmm moddir -p <path>`

Sets the directory where mods will be downloaded to. This is neccesary to begin downloading mods. An example of this command would look like this:

```bash
fmm moddir -p "C:\Users\<name>\AppData\Roaming\.minecraft\mods"
```

### `fmm list`

Returns an ASCII table of all installed mods.

### `fmm version -v <version>`

Updates the version of Fabric to use for mod installation. Automatically updates all mods to the set fabric version. An example of this command would look like this:

```bash
fmm version -v 1.13.2
```

### `fmm disable -q <modID/slug>`

Disables a mod, but stores it's files for use later. An example of this command would look like this:

```bash
fmm disable -q no-chat-reports
```

### `fmm enable -q <modID/slug>`
Enables a mod, and restores it's files. An example of this command would look like this:

```bash
fmm enable -q no-chat-reports
```