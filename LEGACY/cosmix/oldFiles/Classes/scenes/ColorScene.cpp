//
//  ColorScene.cpp
//  boltrix
//
//  Created by Den on 06.09.12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#include "ColorScene.h"
#include "Effect.h"

ColorScene::ColorScene()
{
	
    
    setTouchEnabled( true );
	setAccelerometerEnabled( true );
    
	CCSize screenSize = CCDirector::sharedDirector()->getWinSize();
    
	b2Vec2 gravity;
	gravity.Set(0.0f, -10.0f);
	
	bool doSleep = true;
    
	// Construct a world object, which will hold and simulate the rigid bodies.
	world = new b2World(gravity);
    world->SetAllowSleeping(doSleep);    
	world->SetContinuousPhysics(true);
    ////////////////// LEVEL HELPER INIT HERE //////////////////////////////    
	loader = new LevelHelperLoader( string( "colorSelect.plhs" ).c_str());
	loader->addObjectsToWorld(world, this);
    
    if(loader->hasPhysicBoundaries())
        loader->createPhysicBoundaries(world);
    
    if(!loader->isGravityZero())
        loader->createGravity(world);
    
    currentSprite = NULL;
    r = 255;
    r = 255;
    r = 255;
    
    CCArray * sprites = loader->spritesWithTag(TEMPLATE);
    if (sprites) {
        for (int i=0; i<sprites->count(); i++) {
            LHSprite * sprite = (LHSprite *)sprites->objectAtIndex(i);
            if (sprite) {
                sprite->registerTouchBeganObserver(this, callfuncO_selector(ColorScene::touchBeginOnSprite));
                sprite->registerTouchMovedObserver(this, callfuncO_selector(ColorScene::touchMovedOnSprite));
                sprite->registerTouchEndedObserver(this, callfuncO_selector(ColorScene::touchEndedOnSprite));
                
                string name = sprite->getUniqueName();
                ccColor3B color;
                char rS[30],gS[30],bS[30];
                sprintf(rS,"%s-red", name.c_str());
                sprintf(gS,"%s-green", name.c_str());
                sprintf(bS,"%s-blue", name.c_str());                
                color.r = CCUserDefault::sharedUserDefault()->getFloatForKey( rS, 255 );
                color.g = CCUserDefault::sharedUserDefault()->getFloatForKey( gS, 255 );
                color.b = CCUserDefault::sharedUserDefault()->getFloatForKey( bS, 255 );                
                sprite->setColor(color);
            }
        }
    }
    LHSprite * tmp = loader->spriteWithUniqueName("targetRed");
    red = CCLabelTTF::create("red", "", 20);
    red->setPosition(tmp->getPosition());
    tmp->removeSelf();

    tmp = loader->spriteWithUniqueName("targetGreen");
    green = CCLabelTTF::create("red", "", 20);
    green->setPosition(tmp->getPosition());
    tmp->removeSelf();

    tmp = loader->spriteWithUniqueName("targetBlue");
    blue = CCLabelTTF::create("red", "", 20);
    blue->setPosition(tmp->getPosition());
    tmp->removeSelf();
    //loader->
    
    addChild(red);
    addChild(green);
    addChild(blue);    
    
    redSprite   = loader->spriteWithUniqueName("red");
    greenSprite = loader->spriteWithUniqueName("green");
    blueSprite  = loader->spriteWithUniqueName("blue");
    allSprite  = loader->spriteWithUniqueName("all");
    
    redSprite->registerTouchBeganObserver(this, callfuncO_selector(ColorScene::touchBeginOnSprite));
    redSprite->registerTouchMovedObserver(this, callfuncO_selector(ColorScene::touchMovedOnSprite));
    redSprite->registerTouchEndedObserver(this, callfuncO_selector(ColorScene::touchEndedOnSprite));

    greenSprite->registerTouchBeganObserver(this, callfuncO_selector(ColorScene::touchBeginOnSprite));
    greenSprite->registerTouchMovedObserver(this, callfuncO_selector(ColorScene::touchMovedOnSprite));
    greenSprite->registerTouchEndedObserver(this, callfuncO_selector(ColorScene::touchEndedOnSprite));

    blueSprite->registerTouchBeganObserver(this, callfuncO_selector(ColorScene::touchBeginOnSprite));
    blueSprite->registerTouchMovedObserver(this, callfuncO_selector(ColorScene::touchMovedOnSprite));
    blueSprite->registerTouchEndedObserver(this, callfuncO_selector(ColorScene::touchEndedOnSprite));
    
    allSprite->registerTouchBeganObserver(this, callfuncO_selector(ColorScene::touchBeginOnSprite));
    allSprite->registerTouchMovedObserver(this, callfuncO_selector(ColorScene::touchMovedOnSprite));
    allSprite->registerTouchEndedObserver(this, callfuncO_selector(ColorScene::touchEndedOnSprite));
    

    
    
    sprites = loader->spritesWithTag(MENU_ITEM);
    if (sprites) {
        for (int i=0; i<sprites->count(); i++) {
            LHSprite * sprite = (LHSprite *)sprites->objectAtIndex(i);
            if (sprite) {
                sprite->registerTouchBeganObserver(this, callfuncO_selector(ColorScene::touchBeginOnSprite));
                sprite->registerTouchMovedObserver(this, callfuncO_selector(ColorScene::touchMovedOnSprite));
                sprite->registerTouchEndedObserver(this, callfuncO_selector(ColorScene::touchEndedOnSprite));
            }
        }
    }
    
    redInc      = 0;
    greenInc    = 0;
    blueInc     = 0;
    
    scrollSprite = NULL;
    currentTick = 0;
    schedule( schedule_selector(ColorScene::tick) );
    
}
    
ColorScene::~ColorScene()
{
    
    saveColors();
    
    delete loader;
    loader = NULL;
	
    delete world;
	world = NULL;

}

void ColorScene::touchBeginOnSprite(CCObject* cinfo)
{
    LHTouchInfo* info = (LHTouchInfo*)cinfo;
    LHSprite * sp = info->sprite;
    if (info->sprite) {
        if (info->sprite->getTag() == TEMPLATE) {
            CCArray * sprites = loader->spritesWithTag(TEMPLATE);
            if (sprites) {
                for (int i=0; i<sprites->count(); i++) {
                    LHSprite * sprite = (LHSprite *)sprites->objectAtIndex(i);
                    if (sprite) {
                        sprite->setScale(1);
                        sprite->stopAllActions();
                    }
                }
            }
            info->sprite->runAction(Effect::Bubble(1, 0.1,true));
            currentSprite   = info->sprite;
            currentColor    = currentSprite->getColor();
            r = currentColor.r;
            g = currentColor.g;
            b = currentColor.b;
            setToColor();
            
            saveColors();
        }
        
        if (info->sprite->getTag() == MENU_ITEM) {
            if (currentSprite) {
                if (sp->getUniqueName() == "redPlus")   { redInc = 1;}
                if (sp->getUniqueName() == "redMinus")  { redInc = -1;}
                if (sp->getUniqueName() == "greenPlus") { greenInc = 1;}
                if (sp->getUniqueName() == "greenMinus"){ greenInc = -1;} 
                if (sp->getUniqueName() == "bluePlus")  { blueInc = 1;}
                if (sp->getUniqueName() == "blueMinus") { blueInc = -1;}
                if (sp->getUniqueName() == "allPlus")  { redInc = 1;greenInc = 1;blueInc = 1;}
                if (sp->getUniqueName() == "allMinus") { redInc = -1;greenInc = -1;blueInc = -1;}
                if (sp->getUniqueName() == "random"){
                    r = CCRANDOM_0_1() * 255;
                    g = CCRANDOM_0_1() * 255;
                    b = CCRANDOM_0_1() * 255;                    
                }
                setToColor();

            }
        }
        
        if (sp->getTag() == STARS) {
            scrollSprite = sp;
        }
        
    }
    
    
}

void ColorScene::setToColor()
{
    if (r>255) r=0;
    if (g>255) g=0;
    if (b>255) b=0;                
    if (r<0) r=255;
    if (g<0) g=255;
    if (b<0) b=255;                
    currentColor = ccc3(r,g,b);
    currentSprite->setColor(ccc3(r,g,b));
    
    
    char temp[10];
    sprintf(temp,"r:%i",r);
    red->setString(temp);
    sprintf(temp,"g:%i",g);
    green->setString(temp);
    sprintf(temp,"b:%i",b);
    blue->setString(temp);

    redSprite->setColor(ccc3(r,0,0));
    greenSprite->setColor(ccc3(0,g,0));
    blueSprite->setColor(ccc3(0,0,b));   
    
    
    
}
void  ColorScene::saveColors()
{
    CCArray * sprites = loader->spritesWithTag(TEMPLATE);
    if (sprites) {
        for (int i=0; i<sprites->count(); i++) {
            LHSprite * sprite = (LHSprite *)sprites->objectAtIndex(i);
            if (sprite) {
                
                string name = sprite->getUniqueName();
                ccColor3B color = sprite->getColor();
                char rS[30],gS[30],bS[30];
                sprintf(rS,"%s-red", name.c_str());
                sprintf(gS,"%s-green", name.c_str());
                sprintf(bS,"%s-blue", name.c_str());                
                
                
                CCUserDefault::sharedUserDefault()->setFloatForKey( rS, color.r );
                CCUserDefault::sharedUserDefault()->setFloatForKey( gS, color.g );
                CCUserDefault::sharedUserDefault()->setFloatForKey( bS, color.b );     
                
                CCUserDefault::sharedUserDefault()->flush();
            }
        }
    }    
}


void ColorScene::touchMovedOnSprite(CCObject* cinfo)
{
    LHTouchInfo* info = (LHTouchInfo*)cinfo;
    LHSprite * sp = info->sprite;
    if (info->sprite) {    
        if (sp->getTag() == STARS) {
            if (scrollSprite) {
                if (scrollSprite->getUniqueName() == "red")
                {
                    redInc = info->delta.y;
                }
                if (scrollSprite->getUniqueName() == "green")
                {
                    greenInc = info->delta.y;   
                }
                if (scrollSprite->getUniqueName() == "blue")
                {
                    blueInc = info->delta.y;
                }
                if (scrollSprite->getUniqueName() == "all")
                {
                    blueInc = info->delta.y;
                    greenInc = info->delta.y;
                    redInc = info->delta.y;
                }                
            }
        }
    }

}

void ColorScene::touchEndedOnSprite(CCObject* cinfo)
{
    //LHTouchInfo* info = (LHTouchInfo*)cinfo;
    redInc      = 0;
    greenInc    = 0;
    blueInc     = 0;
    scrollSprite = NULL;
    
}

void ColorScene::tick(float dt)
{
    if (redInc!=0 || blueInc!=0 ||greenInc!=0) {
        if (currentTick <=0 ) {
            currentTick = 0.1;
            r += redInc;
            g += greenInc;
            b += blueInc;
            setToColor();
        }else {
            currentTick -= dt;
        }
    }else {
        currentTick = 0;
    }
    
    
}

CCScene* ColorScene::scene()
{
    // 'scene' is an autorelease object
    CCScene *scene = CCScene::create();
    
    // add layer as a child to scene
    CCLayer* layer = new ColorScene();
    scene->addChild(layer);
    
    
    return scene;
}
