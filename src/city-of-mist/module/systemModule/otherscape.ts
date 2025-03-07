import { RollDialog } from "../roll-dialog.js";
import { MistRoll } from "../mist-roll.js";
import { localize } from "../city.js";
import { CityDB } from "../city-db.js";
import { Themebook } from "../city-item.js";
import { CitySettings } from "../settings.js";
import { Essence } from "../city-item.js";
import { CityActor, PC } from "../city-actor.js";
import { Theme } from "../city-item.js";
import { MistEngineSystem } from "./mist-engine.js";

const PATH = "systems/city-of-mist";

export class OtherScapeSystem extends MistEngineSystem {

	override get localizationStarterName() {
		return "Otherscape" as const;
	}

	override themeIncreaseName(_theme: Theme) {
		return localize("Otherscape.terms.upgrade");
	}

	override themeDecreaseName(_theme: Theme) {
		return localize("Otherscape.terms.decay");
	}

	override async downtimeTemplate(actor: CityActor): Promise<string> {
		const templateData ={actor};
		return await renderTemplate(`${PATH}/templates/dialogs/pc-downtime-chooser-otherscape.hbs`, templateData);
	}

	get name(){ return "otherscape" as const;}
	get localizationString() { return localize("CityOfMist.settings.system.1");}

	headerTable = {
		character: "systems/city-of-mist/templates/otherscape/pc-sheet-header.hbs",
		threat: "",
		crew: ""
	}

	override async onChangeTo() : Promise<void> {
		await super.onChangeTo();
		const settings = CitySettings;
		await settings.set("baseSystem", "otherscape");
		await settings.set("system", "otherscape");
		await settings.set( "movesInclude", "otherscape");
	}

	async determineEssence(actor : PC) {
		if (!CitySettings.get("autoEssence")) return;
		const essence = OtherScapeSystem.determineEssenceFromThemes(actor.mainThemes);
		if (essence) {
			await actor.setEssence(essence);
		}
		return essence;
	}

	static determineEssenceFromThemes(themes: Theme[]) : Essence | undefined {
		const themeTypes = themes.reduce(
			(acc, theme) => {
				const themeType = theme.getThemebook()!.system.subtype;
				if (acc.includes(themeType) || !themeType) return acc;
				acc.push(themeType);
				return acc;
			}
			, [] as Themebook["system"]["subtype"][] );
		let essence : Essence | undefined = undefined;
		switch (themeTypes.length) {
			case 0: return;
			case 1:
				switch (themeTypes[0]) {
					case "Noise":
						essence = CityDB.getEssenceBySystemName("Singularity");
						break;
					case "Self":
						essence = CityDB.getEssenceBySystemName("Real");
						break;
					case "Mythos":
						return; //can'tdefuined essence
				}
			case 2:
				switch (true) {
					case !themeTypes.includes("Mythos"): {
						essence = CityDB.getEssenceBySystemName("Cyborg");
						break;
					}
					case !themeTypes.includes("Noise"): {
						essence = CityDB.getEssenceBySystemName("Spiritualist");
						break;

					}
					case !themeTypes.includes("Self"): {
						essence = CityDB.getEssenceBySystemName("Transhuman");
						break;
					}
				}
				break;
			case 3:
				essence = CityDB.getEssenceBySystemName("Nexus");
				break;
			default:
				break;
		}
		return essence;

	}

	override async activate() {
		super.activate();
		for (const [name, data] of Object.entries(this.systemSettings())) {
			game.settings.register("city-of-mist", name, data)
		}
	}

	protected override async _setHooks () {
		super._setHooks();
		Hooks.on("themeCreated", async (actor, theme) => {
			if (!this.isActive()) return;
			if (actor.system.type != "character") return;
			if (actor.mainThemes.length < 4) return;
			//Nexus Theme Effect
			const oldEssence = actor.essence;
			const newEssence = await this.determineEssence(actor as PC);
			if (actor.isOwner && oldEssence?.system.systemName == "Nexus" && newEssence?.systemName == "Nexus") {
				await theme.update({ "system.nascent": false});
			}
		});
	}

	override async updateRollOptions( html: JQuery, options: Partial<MistRoll["options"]>, dialog: RollDialog) {
		await super.updateRollOptions(html, options, dialog);
	}

	getEssence(actor: CityActor) : keyof EssenceNames | undefined {
		return actor.essence?.system.systemName as keyof EssenceNames;
	}

	override async renderRollDialog( dialog: RollDialog) {
		await super.renderRollDialog(dialog);
		const essence = this.getEssence(dialog.actor);
		const move = CityDB.getMoveById(dialog.move_id);
		if (!move) return;
		if (move.system.category == "SHB") return;
		const selfLoc = localize("Otherscape.dialog.addSelf");
		const mythosLoc = localize("Otherscape.dialog.addMythos");
		const noiseLoc = localize("Otherscape.dialog.addNoise");
		const selfCheck = `
		<div>
		<label class="dialog-label" for="add-self"> ${selfLoc} </label>
		<input id="add-self" type="checkbox" ${false ? "checked": ""} >
		</div>
		`;
		const mythosCheck = `
		<div>
		<label class="dialog-label" for="add-Mythos"> ${mythosLoc} </label>
		<input id="add-self" type="checkbox" ${false ? "checked": ""} >
		</div>
`;
		const noiseCheck = `
		<div>
		<label class="dialog-label" for="add-Noise"> ${noiseLoc} </label>
		<input id="add-self" type="checkbox" ${false ? "checked": ""} >
		</div>
`;
		switch (essence) {
			case "Spiritualist":  {
				const element = `
				<div>
					${selfCheck}
					${mythosCheck}
				</div>
				`;
				dialog.html.find(".essence-effects").append(element);
				break;
			}
			case "Cyborg": {
				const element = `;
				<div>
					${noiseCheck}
					${selfCheck}
					</div>
				`;
				dialog.html.find(".essence-effects").append(element);
				break;
			}
		}
	}

	override systemSettings() : OTHERSETTINGS {
		return {
			...super.systemSettings(),
			"autoEssence": {
				name: localize("CityOfMist.settings.autoEssence.name"),
				hint: localize("CityOfMist.settings.autoEssence.hint"),
				scope: "client",
				config: true,
				type: Boolean,
				default: true,
				restricted: false
			}
		} as const;
	}
}

declare global {

	interface SYSTEM_NAMES {
		"otherscape": string;
	}

	interface EssenceNames {
		Singularity: {}; // all noise
		Conduit: {}; //all mythos (difftype)
		Avatar: {}; //all mythos (same type)
		Cyborg: {}; //self + noise
		Nexus: {}; //three types
		Real : {}; //all self
		Transhuman: {}; // mythos + noise
		Spiritualist: {}; //self +mythos
	}

	interface OTHERSETTINGS extends Record<string & {}, SelectSettings>  {
		"autoEssence": {
				name: string,
				hint: string,
				scope: "client",
				config: true,
				type: BooleanConstructor,
				default: true,
				restricted: false
		}
	}
}

