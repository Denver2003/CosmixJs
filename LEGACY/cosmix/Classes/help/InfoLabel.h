//
//  InfoLabel.h
//  cosmix
//
//  Created by Den on 12.12.12.
//
//

#ifndef __cosmix__InfoLabel__
#define __cosmix__InfoLabel__

#include "LevelHelperLoader.h"

#define CORNERTYPE_LT 0
#define CORNERTYPE_RT 1
#define CORNERTYPE_LB 2
#define CORNERTYPE_RB 3

class InfoLabel : public CCObject
{
public:
	InfoLabel(string _name, int _cornerType = CORNERTYPE_LT, string fontFile="quest.fnt");
	~InfoLabel();
    
    void setValue(string val);
    void setValue(int val);
    
    string value;
    CCLabelBMFont * label;
    
	int cornerType;

	LHSprite *	spriteLabel;
	LHSprite *	spriteIcon;

	CCPoint		textPoint;
	CCPoint		startPoint;
	// size between startpoint and corner
	CCPoint		relativePoint;
	CCSize		relativeSize;

	string		name;
    
    
};


#endif /* defined(__cosmix__InfoLabel__) */
