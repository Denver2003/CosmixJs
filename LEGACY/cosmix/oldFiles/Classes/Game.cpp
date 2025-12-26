#include "Game.h"

Game * Game::instance = NULL;

Game::Game(void)
{
}


Game::~Game(void)
{
}

void Game::init( void )
{
	gameLayer   = CCLayer::create();

	b2Vec2 gravity;
	gravity.Set(0.0f, -10.0f);
	
	bool doSleep = true;
    
	// Construct a world object, which will hold and simulate the rigid bodies.
	world = new b2World(gravity);
    world->SetAllowSleeping(doSleep);
	world->SetContinuousPhysics(true);
    
	LevelHelperLoader::dontStretchArt();
    
    loader      = new LevelHelperLoader("level.plhs");
    
}

void Game::loadToWorld( void )
{
    loader->addObjectsToWorld(world, gameLayer);

	if(loader->hasPhysicBoundaries())
        loader->createPhysicBoundaries(world);
    
    if(!loader->isGravityZero())
        loader->createGravity(world);


}

Game *	Game::getInstance()
{
	if(!Game::instance){
		Game::instance = new Game();
		Game::instance->init();
	}
	return Game::instance;
}

void	Game::destroyInstance()
{
	if( Game::instance ){
		delete Game::instance;
		Game::instance = NULL;
	}
}

LevelHelperLoader *	Game::getLoader()
{
	return Game::getInstance()->loader;
}

b2World* Game::getWorld()
{
	return Game::getInstance()->world;
}

CCLayer *	Game::getGameLayer()
{
	return Game::getInstance()->gameLayer;
}
