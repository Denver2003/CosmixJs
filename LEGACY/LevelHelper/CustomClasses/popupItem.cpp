//This source file was generated automatically by LevelHelper
//based on the class template defined by the user.
//For more info please visit: www.levelhelper.org


#include "popupItem.h"
#include "../Utilities/LHDictionary.h"
#include "../Utilities/LHArray.h"
#include "../Utilities/LHObject.h"

popupItem::~popupItem(){

}

void popupItem::setPropertiesFromDictionary(LHDictionary* dictionary){

	if(dictionary->objectForKey("align"))
		setAlign(dictionary->objectForKey("align")->stringValue());

	if(dictionary->objectForKey("delayHide"))
		setDelayHide(dictionary->objectForKey("delayHide")->floatValue());

	if(dictionary->objectForKey("buttonName"))
		setButtonName(dictionary->objectForKey("buttonName")->stringValue());

	if(dictionary->objectForKey("delay"))
		setDelay(dictionary->objectForKey("delay")->floatValue());

	if(dictionary->objectForKey("fontName"))
		setFontName(dictionary->objectForKey("fontName")->stringValue());

	if(dictionary->objectForKey("isLabel"))
		setIsLabel(dictionary->objectForKey("isLabel")->boolValue());

	if(dictionary->objectForKey("buttonSheet"))
		setButtonSheet(dictionary->objectForKey("buttonSheet")->stringValue());

	if(dictionary->objectForKey("value"))
		setValue(dictionary->objectForKey("value")->stringValue());

	if(dictionary->objectForKey("showType"))
		setShowType(dictionary->objectForKey("showType")->floatValue());

	if(dictionary->objectForKey("isButton"))
		setIsButton(dictionary->objectForKey("isButton")->boolValue());

}

