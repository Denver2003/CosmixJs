//
//  LoadingScene.cpp
//  boltrix
//
//  Created by Den on 19.09.12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#include "LoadingScene.h"
#include "game.h"
#include "loader.h"
#include "LevelLoader.h"
#include "GameScene.h"
#include "HelloWorldScene.h"
#include "TaskManager.h"

LoadingScene::LoadingScene()
{

    setTouchEnabled(true);
    setAccelerometerEnabled(true);
//    setIsTouchEnabled( true );
//	setIsAccelerometerEnabled( true );
    
	CCSize screenSize = CCDirector::sharedDirector()->getWinSize();
    
	b2Vec2 gravity;
	gravity.Set(0.0f, -10.0f);
	
	bool doSleep = true;
    

    
	// Construct a world object, which will hold and simulate the rigid bodies.
	world = new b2World(gravity);
    world->SetAllowSleeping(doSleep);    
	world->SetContinuousPhysics(true);

	LevelHelperLoader::dontStretchArt();
    ////////////////// LEVEL HELPER INIT HERE //////////////////////////////    
	gameSceneLoader = new LevelHelperLoader( string( "loading.plhs" ).c_str());
	gameSceneLoader->addObjectsToWorld(world, this);

    
    /*if(loader->hasPhysicBoundaries())
        loader->createPhysicBoundaries(world);
    
    if(!loader->isGravityZero())
        loader->createGravity(world);
*/
    
    
    schedule( schedule_selector(LoadingScene::tick) );
    
}

LoadingScene::~LoadingScene()
{
    
}

void LoadingScene::tick(float dt)
{
    Loader::shared();
    LevelLoader::getInstance(); //загружаем уровни из файла
    CTaskManager::getInstance();
    
    
    //CCDirector::sharedDirector()->replaceScene( PlayScene::scene("testlevel"));

    Game::getInstance()->getLoader()->registerLoadingProgressObserver(this, callfuncFloat_selector(LoadingScene::loadingProgress));
    Game::getInstance()->loadToWorld();
    
    unschedule(schedule_selector(LoadingScene::tick));
}

CCScene* LoadingScene::scene()
{
    // 'scene' is an autorelease object
    CCScene *scene = CCScene::create();
    
    // add layer as a child to scene
    CCLayer* layer = new LoadingScene();
    scene->addChild(layer);
    
    
    return scene;
}

void LoadingScene::loadingProgress(float progressValue)
{
    if (progressValue >= 1) {
        /// loading play scene
            CCDirector::sharedDirector()->replaceScene( GameScene::scene());
			//CCDirector::sharedDirector()->replaceScene( HelloWorld::scene());
        
    }
}