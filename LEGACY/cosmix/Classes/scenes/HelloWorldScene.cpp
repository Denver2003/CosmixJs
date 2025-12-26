//
//  HelloWorldScene.cpp
//  Boltrix
//
//  Created by Den on 16.03.12.
//  Copyright __MyCompanyName__ 2012. All rights reserved.
//
#include "HelloWorldScene.h"
#include "MainMenuScene.h"
#include "SimpleAudioEngine.h"
#include "GameScene.h"
#include "Loader.h"
#include "levelLoader.h"

using namespace cocos2d;
using namespace CocosDenshion;

#define PTM_RATIO 32
enum 
{
	kTagTileMap = 1,
	kTagSpriteManager = 1,
	kTagAnimation1 = 1,
}; 

HelloWorld::HelloWorld()
{
	schedule( schedule_selector(HelloWorld::tick) );
}

HelloWorld::~HelloWorld()
{

	
	//delete m_debugDraw;
}


void HelloWorld::tick(float dt)
{
    
    unscheduleAllSelectors();
    Loader::shared();
    LevelLoader::getInstance(); //загружаем уровни из файла
    
    
    //CCDirector::sharedDirector()->replaceScene( PlayScene::scene("testlevel"));
    CCDirector::sharedDirector()->replaceScene( GameScene::scene());
    //CCDirector::sharedDirector()->replaceScene( MainMenu::scene());
}

CCScene* HelloWorld::scene()
{
    // 'scene' is an autorelease object
    CCScene *scene = CCScene::node();
    
    // add layer as a child to scene
    CCLayer* layer = new HelloWorld();
    scene->addChild(layer);
    layer->release();
    
    return scene;
}
