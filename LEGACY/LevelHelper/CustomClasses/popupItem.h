//This header file was generated automatically by LevelHelper
//based on the class template defined by the user.
//For more info please visit: www.levelhelper.org


#ifndef LH_popupItem_H
#define LH_popupItem_H

#include <string>
#include <vector>
#include "LHAbstractClass.h"
class LHDictionary;

class popupItem :public LHAbstractClass
{

public:

	popupItem(void){}
	virtual ~popupItem(void);

	virtual std::string className(){return std::string("popupItem");}

	virtual void setPropertiesFromDictionary(LHDictionary* dictionary);

	std::string& getAlign(void){return align;}
	void setAlign(const std::string& val){align = val;}

	float getDelayHide(void){return delayHide;}
	void setDelayHide(float val){delayHide = val;}

	std::string& getButtonName(void){return buttonName;}
	void setButtonName(const std::string& val){buttonName = val;}

	float getDelay(void){return delay;}
	void setDelay(float val){delay = val;}

	std::string& getFontName(void){return fontName;}
	void setFontName(const std::string& val){fontName = val;}

	bool getIsLabel(void){return isLabel;}
	void setIsLabel(bool val){isLabel = val;}

	std::string& getButtonSheet(void){return buttonSheet;}
	void setButtonSheet(const std::string& val){buttonSheet = val;}

	std::string& getValue(void){return value;}
	void setValue(const std::string& val){value = val;}

	float getShowType(void){return showType;}
	void setShowType(float val){showType = val;}

	bool getIsButton(void){return isButton;}
	void setIsButton(bool val){isButton = val;}



	std::string align;
	float delayHide;
	std::string buttonName;
	float delay;
	std::string fontName;
	bool isLabel;
	std::string buttonSheet;
	std::string value;
	float showType;
	bool isButton;

};

#endif
