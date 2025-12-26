//
//  InfoLabel.cpp
//  cosmix
//
//  Created by Den on 12.12.12.
//
//

#include "InfoLabel.h"
#include "Game.h"

InfoLabel::InfoLabel(string _name, int _cornerType, string fontFile)
{
	name = _name;
	cornerType = _cornerType;
	CCSize winSize = CCDirector::sharedDirector()->getWinSize();

	LHLayer * mLayer = Game::getLoader()->layerWithUniqueName("MAIN_LAYER");
	LHBatch * batch = mLayer->batchWithUniqueName("labels");
    
    
    label = CCLabelBMFont::create("", fontFile.c_str() );
    
	switch( cornerType ){
	case CORNERTYPE_LT:
		relativePoint.x = 0;
		relativePoint.y = winSize.height;
        label->setAnchorPoint(ccp(1,0.5));
		break;
	case CORNERTYPE_RT:
		relativePoint.x = winSize.width;
		relativePoint.y = winSize.height;
        label->setAnchorPoint(ccp(0,0.5));
		break;
	case CORNERTYPE_LB:
		relativePoint.x = 0;
		relativePoint.y = 0;
        label->setAnchorPoint(ccp(1,0.5));
		break;
	case CORNERTYPE_RB:
		relativePoint.x = winSize.width;
		relativePoint.y = 0;
        label->setAnchorPoint(ccp(0,0.5));
            
		break;
	}

	spriteLabel = Game::getLoader()->spriteWithUniqueName( "label_" + name );
	spriteIcon = Game::getLoader()->spriteWithUniqueName( "icon_" + name );
	
	LHSprite * 
		spriteTmp = Game::getLoader()->spriteWithUniqueName( "start_" + name );
	if( spriteTmp ){
		startPoint = spriteTmp->getPosition();
	}
		spriteTmp = Game::getLoader()->spriteWithUniqueName( "debug_" + name );
	if( spriteTmp ){
		textPoint = spriteTmp->getPosition();
	}

	relativeSize.width = startPoint.x - relativePoint.x;
	relativeSize.height = startPoint.y - relativePoint.y;
    
    if (spriteLabel && spriteIcon) {
        spriteLabel->setPosition(ccp(
                                     spriteLabel->getPosition().x - relativeSize.width,
                                     spriteLabel->getPosition().y - relativeSize.height )
                                 );
        
        spriteIcon->setPosition(ccp(
                                    spriteIcon->getPosition().x - relativeSize.width,
                                    spriteIcon->getPosition().y - relativeSize.height )
                                );
        textPoint.x = textPoint.x - relativeSize.width;
        textPoint.y = textPoint.y - relativeSize.height;
        
        label->setPosition(textPoint);
        if (mLayer) {
            mLayer->addChild(label,6);
        }
    }
    value = "";
    setValue("");
    
}

InfoLabel::~InfoLabel()
{

}

void InfoLabel::setValue(string val)
{
    value = val;
    label->setString(value.c_str());
}

void InfoLabel::setValue(int val)
{
    char tmp[10];
    sprintf(tmp, "%i", val);
    value = string(tmp);
    label->setString(value.c_str());
   
}

