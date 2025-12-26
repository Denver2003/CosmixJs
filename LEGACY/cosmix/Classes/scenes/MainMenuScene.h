//
//  MainMenuScene.h
//  boltrix
//
//  Created by Den on 01.07.12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#ifndef boltrix_MainMenuScene_h
#define boltrix_MainMenuScene_h



// When you import this file, you import all the cocos2d classes
#include "cocos2d.h"
#include "LevelHelperLoader.h"


class MainMenu : public cocos2d::CCLayer {
public:
    ~MainMenu();
    MainMenu();
    
    // returns a Scene that contains the HelloWorld as the only child
    static cocos2d::CCScene* scene();
    void tick(float dt);
    
    LevelHelperLoader * loader;
    b2World*            world;
    
    void touchBeginOnSprite(CCObject* cinfo);
    void spriteAnimHasEnded(CCObject * object);
    void touchMovedOnSprite(CCObject* cinfo);
    void touchEndedOnSprite(CCObject* cinfo);
    void mainLabelAfterCreate(CCNode * node);
    void menuItemAfterCreate(CCNode * node, void * Data);    
    
    bool isPressed;
    
};

#endif
