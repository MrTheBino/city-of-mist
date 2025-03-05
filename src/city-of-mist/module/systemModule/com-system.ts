import { localize } from "../city.js";
import {CityActor} from "../city-actor.js";
import { Theme } from "../city-item.js";
import { CityItem } from "../city-item.js";
import { FADETYPELIST } from "../datamodel/fade-types.js";
import { Move } from "../city-item.js";
import { CoMTypeSystem } from "./com-type-system.js";

const PATH = "systems/city-of-mist";

export class CoMSystem extends CoMTypeSystem {

	override get localizationStarterName() {
		return "CityOfMist" as const;
	}

	override canCreateTags(_move: Move): boolean {
		return true;
				//TODO: May fix this later, but given the breadth of moves that can create things, some through dynamite results, it's best to just allow it for everything.
	}

	override themeIncreaseName(_theme: Theme) {
		return localize("CityOfMist.terms.attention");
	}

	override themeDecreaseName(theme: Theme) {
		if (theme.themebook)
			return theme.themebook.system.fade_type;
		const defFade =  CityItem.getCoMdefaultFade(theme.getThemeType());
		if (defFade == "crew")  {
			return localize(FADETYPELIST["fade"]) + " / " + localize(FADETYPELIST["crack"]);
		}
		return localize(FADETYPELIST[defFade]);
	}

	override async downtimeTemplate(actor: CityActor): Promise<string> {
		const templateData ={actor};
		return await renderTemplate(`${PATH}/templates/dialogs/pc-downtime-chooser-com.hbs`, templateData);
	}
	get name() {return  "city-of-mist" as const;}
	get localizationString() {return localize("CityOfMist.settings.system.0");}

	override async activate() {
		super.activate();
	}

	headerTable = {
		character: "systems/city-of-mist/templates/parts/character-sheet-header.html",
		threat: "",
		crew: ""
	}

	override async onChangeTo() : Promise<void> {
		await super.onChangeTo();
		const settings = this.settings;
		await settings.set("baseSystem", "city-of-mist");
		await settings.set( "movesInclude", "city-of-mist");
		await settings.set("system", "city-of-mist");
	}
}


declare global {
	interface SYSTEM_NAMES {
		"city-of-mist": string;
	}
}


