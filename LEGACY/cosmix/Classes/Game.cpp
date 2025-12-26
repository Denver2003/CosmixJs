#include "Game.h"
#include "Alien.h"
#include "Test.h"


Game * Game::instance = NULL;
//-----------------------------------------
Game::Game(void)
{
}
//-----------------------------------------
Game::~Game(void)
{
}
//-----------------------------------------
void Game::init( void )
{
	gameLayer       = CCLayer::create();
	menuLayer       = CCLayer::create();
	submenuLayer    = CCLayer::create();
	shopLayer       = CCLayer::create();
    
    //menuLayer->setVisible(false);
//    shopLayer->setVisible(false);
    
	b2Vec2 gravity;
	gravity.Set(0.0f, -10.0f);
	
	bool doSleep = true;
    
	// Construct a world object, which will hold and simulate the rigid bodies.
	world = new b2World(gravity);
    world->SetAllowSleeping(doSleep);
	world->SetContinuousPhysics(true);
    
	LevelHelperLoader::dontStretchArt();
    // общая функция обработки анимаций
    /*CCNotificationCenter::sharedNotificationCenter()->addObserver(this,
                                                                  callfuncO_selector(Game::spriteAnimHasEnded),
                                                                  LHAnimationHasEndedNotification,
                                                                  NULL);
     */
    loader      = new LevelHelperLoader("level.plhs");
}
//-----------------------------------------
void  Game::destroy( void )
{
    /*CCNotificationCenter::sharedNotificationCenter()->removeObserver(this,
                                        LHAnimationHasEndedNotification);
     */
}
//-----------------------------------------
void Game::loadToWorld( void )
{
    loader->addObjectsToWorld(world, gameLayer);

	if(loader->hasPhysicBoundaries())
        loader->createPhysicBoundaries(world);
    
    if(!loader->isGravityZero())
        loader->createGravity(world);
}
//-----------------------------------------
Game *	Game::getInstance()
{
	if(!Game::instance){
		Game::instance = new Game();
		Game::instance->init();
	}
	return Game::instance;
}
//-----------------------------------------
void	Game::destroyInstance()
{
	if( Game::instance ){
        Game::instance->destroy();
		delete Game::instance;
		Game::instance = NULL;
	}
}
//-----------------------------------------
LevelHelperLoader *	Game::getLoader()
{
	return Game::getInstance()->loader;
}
//-----------------------------------------
b2World* Game::getWorld()
{
	return Game::getInstance()->world;
}
//-----------------------------------------
CCLayer *	Game::getGameLayer()
{
	return Game::getInstance()->gameLayer;
}
//-----------------------------------------
CCLayer *	Game::getMenuLayer()
{
	return Game::getInstance()->menuLayer;
}
CCLayer *	Game::getSubMenuLayer()
{
	return Game::getInstance()->submenuLayer;
}
CCLayer *	Game::getShopLayer()
{
	return Game::getInstance()->shopLayer;
}


///----------------------------------------
void Game::spriteAnimHasEnded(CCObject * object)
{
    CCLog("Game::spriteAnimHasEnded");
    LHSprite *  spr = (LHSprite*) object;
    if (!spr) {
        return;
    }
    std::string     animationName   = spr->animationName();
    
    CCLog("sprite = %s ; animation = %s;", spr->getUniqueName().c_str(),spr->animationName().c_str() );
    // Удаление спрайтов с тегом DELETING_SPRITE
    if (spr->getTag() == DELETING_SPRITE) {
        CCLog("sprite = %s",spr->getUniqueName().c_str());
		spr->removeSelf();
        return;
    }
    
    Alien * alien = (Alien *)spr->getUserObject();
    int action = *(int*)spr->getUserData();
    
    if (alien) {
        if (action == ANIM_ACTION_FIGURE_BLINK || action == ANIM_ACTION_FIGURE_FALL ) {
            alien->genNewTimeToNextBlink();
            alien->animFigure( ANIM_STATE_NORMAL );
        }
    }
     

    
}
