#ifndef boltrix_game_h
#define boltrix_game_h

#include "LevelHelperLoader.h"
class Game
{
public:

	void init( void );
    void loadToWorld( void );
    
    
	
	static Game *				getInstance();
	static void					destroyInstance();
	static LevelHelperLoader *	getLoader();
	static b2World *			getWorld();
	static CCLayer *			getGameLayer();

private:
	Game(void);
	~Game(void);
	LevelHelperLoader * loader;
    b2World*            world;
	CCLayer *			gameLayer;

	static Game * instance;
};

#endif