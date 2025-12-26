//
//  HelloWorldScene.cpp
//  cosmix
//
//  Created by Den on 30.10.12.
//  Copyright __MyCompanyName__ 2012. All rights reserved.
//
#include "HelloWorldScene.h"
#include "SimpleAudioEngine.h"
#include "Alien.h"
#include "AliensManager.h"
#include "Game.h"

using namespace cocos2d;
using namespace CocosDenshion;

#define PTM_RATIO 32

enum {
    kTagParentNode = 1,
};

HelloWorld::HelloWorld()
{
    loader = NULL;
    world = NULL;
    setTouchEnabled( true );
    setAccelerometerEnabled( true );

    LevelHelperLoader::dontStretchArt();
    
    
    /////////////////////////// PHYSIC WORLD INIT  /////////////////////////
	b2Vec2 gravity;
	gravity.Set(0.0f, -10.0f);
	
	bool doSleep = true;
	camera = CCLayer::create();
	camera->setPosition(ccp(0,0));
	this->addChild(camera);

    
	// Construct a world object, which will hold and simulate the rigid bodies.
	world = new b2World(gravity);
    world->SetAllowSleeping(doSleep);
	world->SetContinuousPhysics(true);
    
    loader = new LevelHelperLoader( "level.plhs" );
    
    
    
    loader->addObjectsToWorld(world, camera);
    
    scheduleUpdate();
    
    
}

HelloWorld::~HelloWorld()
{
   
    if (loader) {
        delete loader;
        loader = NULL;
    }

	delete world;
    world = NULL;
    

}


void HelloWorld::draw()
{
}



void HelloWorld::update(float dt)
{
    //It is recommended that a fixed time step is used with Box2D for stability
    //of the simulation, however, we are using a variable time step here.
    //You need to make an informed choice, the following URL is useful
    //http://gafferongames.com/game-physics/fix-your-timestep/
    
    int velocityIterations = 8;
    int positionIterations = 1;
    
    if (world && loader) {
        // Instruct the world to perform a single step of simulation. It is
        // generally best to keep the time step and iterations fixed.
        world->Step(dt, velocityIterations, positionIterations);
        
        //Iterate over the bodies in the physics world
        for (b2Body* b = world->GetBodyList(); b; b = b->GetNext())
        {
            if (b->GetUserData() != NULL) {
                //Synchronize the AtlasSprites position and rotation with the corresponding body
                CCSprite* myActor = (CCSprite*)b->GetUserData();
                myActor->setPosition( CCPointMake( b->GetPosition().x * loader->meterRatio(), b->GetPosition().y * loader->meterRatio()) );
                myActor->setRotation( -1 * CC_RADIANS_TO_DEGREES(b->GetAngle()) );
            }    
        }
        //Alien::updatePositions();
        
    }
}


CCScene* HelloWorld::scene()
{
    // 'scene' is an autorelease object
    CCScene *scene = CCScene::create();
    
    // add layer as a child to scene
    CCLayer* layer = new HelloWorld();
    scene->addChild(layer);
    layer->release();
    
    return scene;
}


void HelloWorld::ccTouchesBegan	(cocos2d::CCSet* touches, cocos2d::CCEvent* event){

    
    
    int tag = CCRANDOM_0_1()*8;
    int type = CCRANDOM_0_1()*7 + 1;
    char typeStr[10];
    sprintf(typeStr,"type%i", type);
    
    Figure * fig = new Figure("type2", typeStr, tag + TAG_FROM, 4, ccc3(10,10,12) );
    
    
    //LHSprite * sp = loader->createBatchSpriteWithUniqueName("type1");
    //sp->transformPosition(ccp(160,240));
    
    CCSetIterator it;
    for( it = touches->begin(); it != touches->end(); ++it){
        if (*it){
            CCTouch* touch = (CCTouch*)( *it );
            CCPoint location = CCDirector::sharedDirector()->convertToGL( touch->getLocationInView() );
				
			//LHSprite::batchSpriteWithName("type40001", batch );
			

			AliensManager::getInstance()->createPhysicsAlien( fig );

            //Alien * al = new Alien(loader, fig, true);
			//al->getSprite()->transformPosition(ccp(100,100));
            //al->getSprite()->transformPosition(touch->getLocation());
			
			//camera->setPosition( touch->getLocation() );
            
        }
    }
    
}

