#ifndef boltrix_game_h
#define boltrix_game_h

#define ANIM_ACTION_FIGURE_BLINK 1
#define ANIM_ACTION_FIGURE_FALL 2

#include "LevelHelperLoader.h"
class Game : public CCObject
{
public:

	void init( void );
	void destroy( void );
    
    void loadToWorld( void );
    void spriteAnimHasEnded(CCObject * object);
    
	
	static Game *				getInstance();
	static void					destroyInstance();
	static LevelHelperLoader *	getLoader();
	static b2World *			getWorld();
	static CCLayer *			getGameLayer();
	static CCLayer *			getMenuLayer();
	static CCLayer *			getSubMenuLayer();
	static CCLayer *			getShopLayer();
    
    
    


private:
	Game(void);
	~Game(void);
	LevelHelperLoader * loader;
    b2World*            world;
	CCLayer *			gameLayer;
	CCLayer *			menuLayer;
	CCLayer *			submenuLayer;
	CCLayer *			shopLayer;
    
    
    

	static Game * instance;
};

#endif