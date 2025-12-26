//
//  ColorScene.h
//  boltrix
//
//  Created by Den on 06.09.12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#ifndef boltrix_ColorScene_h
#define boltrix_ColorScene_h

#include "LevelHelperLoader.h"



class ColorScene : public cocos2d::CCLayer {
public:
    ColorScene();
    ~ColorScene();
    
    // returns a Scene that contains the HelloWorld as the only child
    static cocos2d::CCScene* scene();

    
    void touchBeginOnSprite(CCObject* cinfo);
    void touchMovedOnSprite(CCObject* cinfo);
    void touchEndedOnSprite(CCObject* cinfo);    
    
    
    void tick(float dt);
    
    void setToColor();
    void saveColors();    
    
    
    b2World*            world;
    LevelHelperLoader * loader;
    
    
    CCLabelTTF *        red;
    CCLabelTTF *        green;
    CCLabelTTF *        blue;
    
    LHSprite *          currentSprite;
    ccColor3B           currentColor;
    
    int             r;
    int             g;
    int             b;    

    LHSprite *          redSprite;
    LHSprite *          greenSprite;
    LHSprite *          blueSprite;
    LHSprite *          allSprite;
    

    int redInc;
    int greenInc;
    int blueInc;
    
    float currentTick;
    
    CCPoint prevPos;
    LHSprite * scrollSprite;
    
};

#endif
