//
//  MainMenuScene.cpp
//  boltrix
//
//  Created by Den on 01.07.12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#include "MainMenuScene.h"
#include "SimpleAudioEngine.h"
#include "GameScene.h"
#include "ColorScene.h"
#include "Loader.h"
#include "levelLoader.h"
#include "Effect.h"
#include "LoadingScene.h"

using namespace cocos2d;
using namespace CocosDenshion;



MainMenu::MainMenu()
{
    loader = NULL;
    world = NULL;
    
	b2Vec2 gravity;
	gravity.Set(0.0f, -10.0f);
	
	bool doSleep = true;
    isPressed = false;
    
	// Construct a world object, which will hold and simulate the rigid bodies.
	world = new b2World(gravity);
    world->SetAllowSleeping(doSleep);    
	world->SetContinuousPhysics(true);    
    
    ////////////////// LEVEL HELPER INIT HERE //////////////////////////////    
    LevelHelperLoader::dontStretchArt();
    
	loader = new LevelHelperLoader( string( "mainMenu.plhs" ).c_str());
	loader->addObjectsToWorld(world, this ); 
    
    LHSprite* menuPlaySprite = loader->spriteWithUniqueName("buttonPlay");
    
    menuPlaySprite->registerTouchBeganObserver(this, callfuncO_selector(MainMenu::touchBeginOnSprite));
    menuPlaySprite->registerTouchMovedObserver(this, callfuncO_selector(MainMenu::touchMovedOnSprite));
    menuPlaySprite->registerTouchEndedObserver(this, callfuncO_selector(MainMenu::touchEndedOnSprite));

    menuPlaySprite = loader->spriteWithUniqueName("buttonShop");
    
    menuPlaySprite->registerTouchBeganObserver(this, callfuncO_selector(MainMenu::touchBeginOnSprite));
    menuPlaySprite->registerTouchMovedObserver(this, callfuncO_selector(MainMenu::touchMovedOnSprite));
    menuPlaySprite->registerTouchEndedObserver(this, callfuncO_selector(MainMenu::touchEndedOnSprite));
    
    
	schedule( schedule_selector(MainMenu::tick) );
}

MainMenu::~MainMenu()
{
    delete loader;
    loader = NULL;
	
    delete world;
	world = NULL;    
	
	//delete m_debugDraw;
}

void MainMenu::touchBeginOnSprite(CCObject* cinfo)
{
    LHTouchInfo* info = (LHTouchInfo*)cinfo;
    if(info->sprite){
        info->sprite->runAction(CCScaleBy::create(0.2, 1.1));
    }    
    
    if(info->sprite){
        isPressed = true;
        if (info->sprite->getUniqueName() == "buttonPlay") {
       /*[player prepareAnimationNamed:@"mouseFall" fromSHScene:@"mouse.pshs"];
        [player playAnimation];
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(fallAnimHasEnded:)
                                                     name:LHAnimationHasEndedNotification
                                                   object:player];
												   */
			info->sprite->prepareAnimationNamed("buttonPressPlay","menu.pshs");
			info->sprite->playAnimation();
			CCNotificationCenter::sharedNotificationCenter()->addObserver(
				this,
				callfuncO_selector(MainMenu::spriteAnimHasEnded),
				LHAnimationHasEndedNotification,
				info->sprite
				);


            /* old version
			info->sprite->startAnimationNamed("buttonPressPlay", 0, 
                                              this, 
                                              callfuncND_selector(MainMenu::spriteAnimHasEnded),
                                              false);

											  */
            
        }
        if (info->sprite->getUniqueName() == "buttonShop") {
			
			info->sprite->prepareAnimationNamed("buttonPressShop","menu.pshs");
			info->sprite->playAnimation();
			CCNotificationCenter::sharedNotificationCenter()->addObserver(
				this,
				callfuncO_selector(MainMenu::spriteAnimHasEnded),
				LHAnimationHasEndedNotification,
				info->sprite
				);
        }
        
    }

    
}

void  MainMenu::spriteAnimHasEnded(CCObject * object)
{
    LHSprite *      spr             = (LHSprite*) object;
	std::string     animationName   = spr->animationName();
    if (animationName == "buttonPressPlay" ) {
        /// play game
       CCDirector::sharedDirector()->replaceScene( GameScene::scene());
    }
    if (animationName == "buttonPressShop" ) {
        /// shop
        //CCDirector::sharedDirector()->replaceScene( ColorScene::scene());
        CCDirector::sharedDirector()->replaceScene( LoadingScene::scene());
        
    }

    
}

void MainMenu::touchMovedOnSprite(CCObject* cinfo)
{
    //LHTouchInfo* info = (LHTouchInfo*)cinfo;
}



void MainMenu::touchEndedOnSprite(CCObject* cinfo)
{
    
    LHTouchInfo* info = (LHTouchInfo*)cinfo;

    if(info->sprite){
        info->sprite->runAction(CCScaleBy::create(0.2, 1));
    }    
    
    
    if (isPressed) {
        return;
    }
    
    isPressed = false;

    
    
    
}



void MainMenu::tick(float dt)
{
    
    unscheduleAllSelectors();
    
    LHSprite * mainLabel = loader->spriteWithUniqueName("mainLabel");
    if (mainLabel) {
        mainLabel->setScale(2);
        mainLabel->setOpacity(0);  
        mainLabel->setVisible(true);
        //poyavlenie
        CCDelayTime * preDelay = CCDelayTime::create(1);        
        CCScaleTo * scale1 = CCScaleTo::create(0.2, 0.9);
        CCScaleTo * scale2 = CCScaleTo::create(0.2, 1.06);
        CCScaleTo * scale3 = CCScaleTo::create(0.2, 0.97);
        CCScaleTo * scale4 = CCScaleTo::create(0.2, 1.03);        
        CCScaleTo * scale5 = CCScaleTo::create(0.2, 1);                
        CCDelayTime * delay = CCDelayTime::create(0.4);
        
        CCFadeTo * fade = CCFadeTo::create(1, 255 );
        //CCMoveBy * moveBy1 = CCMov
        
        CCCallFuncN * func = CCCallFuncN::create(this, callfuncN_selector(MainMenu::mainLabelAfterCreate));
        
        
        mainLabel->runAction(CCSequence::create( preDelay,scale1,scale2,scale3,scale4,scale5,delay,func,NULL ));
        mainLabel->runAction( CCSequence::create(preDelay,fade, NULL) );
    }
    bool leftSide = true;
    CCArray * tmpSprites = loader->spritesWithTag(MENU_ITEM);
    for(unsigned int i=0; i < tmpSprites->count(); i++ ){
        LHSprite * sprite = (LHSprite *)tmpSprites->objectAtIndex( i );
        if(sprite){
            CCPoint pnt = sprite->getPosition();
            CCPoint oldPoint = sprite->getPosition();
            sprite->setVisible(true);
            
            if (leftSide) {
                pnt.x = - sprite->boundingBox().size.width / 2;
            }else {
                pnt.x = CCDirector::sharedDirector()->getWinSize().width + sprite->boundingBox().size.width / 2;
            }
            sprite->setPosition(pnt);
            
            //CCSequence::create(
            CCDelayTime * preDelay = CCDelayTime::create(1.5);        
            CCMoveTo * move = CCMoveTo::create(0.4, oldPoint);
            CCCallFuncND * func = CCCallFuncND::create(this, callfuncND_selector(MainMenu::menuItemAfterCreate), (void *)leftSide);
            sprite->runAction(CCSequence::create(preDelay,move,Effect::Bubble(0.8, 0.1),func,NULL));
            
            leftSide = !leftSide;
        }
    }
    
    LHSprite * planet = loader->spriteWithUniqueName("planet");
    if (planet) {
        CCRotateBy * rotate = CCRotateBy::create(20, 180);
        
        
        //CCSequence * seq = CCSequence::create(  );
        planet->runAction(CCRepeatForever::create((CCActionInterval *) rotate));
    }
    
    
    
    //CCDirector::sharedDirector()->replaceScene( PlayScene::scene("testlevel"));
    
}

void MainMenu::mainLabelAfterCreate(CCNode * node){
    LHSprite * sprite = (LHSprite *)node;
    if (sprite) {
        if (sprite->getUniqueName() == "mainLabel") {
            CCScaleTo * scale2 = CCScaleTo::create(2,  1.03);
            CCScaleTo * scale3 = CCScaleTo::create(2,  0.97);
            CCDelayTime * delay = CCDelayTime::create(0.3);
            
            sprite->runAction(CCRepeatForever::create(
                     (CCActionInterval *) CCSequence::create( scale2, delay, scale3, delay,NULL ))
                              );
        }
        
    }
}

void MainMenu::menuItemAfterCreate(CCNode * node, void * Data){
    LHSprite * sprite = (LHSprite *)node;
    bool leftSide = (bool)Data;
    if (sprite) {
        if (sprite->getTag() == MENU_ITEM) {
            CCMoveBy * move1 = CCMoveBy::create(0.2, ccp(0,2) );\
            CCMoveBy * move2 = CCMoveBy::create(0.2, ccp(0,-2) );            
            CCDelayTime * delay = CCDelayTime::create(0.1);
            
            if (leftSide) {
                sprite->runAction(CCRepeatForever::create(
                                                                    (CCActionInterval *) CCSequence::create( move1, delay, move2, delay,NULL ))
                                  );
            }else {
                sprite->runAction(CCRepeatForever::create(
                                                                    (CCActionInterval *) CCSequence::create( delay, move1, delay, move2, NULL ))
                                  );

            }
            
            
        }
        
    }
    
}

CCScene* MainMenu::scene()
{
    // 'scene' is an autorelease object
    CCScene *scene = CCScene::create();
    
    // add layer as a child to scene
    CCLayer* layer = new MainMenu();
    scene->addChild(layer);
    layer->release();
    
    return scene;
}

