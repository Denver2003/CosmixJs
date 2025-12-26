#ifndef __cosmix__Laser__
#define __cosmix__Laser__

#include "LevelHelperLoader.h"

#define LASER_STAY  0
#define LASER_FIND  1
#define LASER_KILL  2
#define LASER_PREKILL  3

#define TIME_GAME_OVER    10.0
#define TIME_TO_START_SOUND    2.0




class Laser :
	public CCObject
{
public:

	LHSprite *	sprite;
	int			laserType;
	int			needType;
	CCRect      rectGameOver;
	CCPoint     laserPoint;

	bool		isWaitingGameOver;
	float		timeToGameOver;

	Laser(void);
	~Laser(void);
	void getSpriteFromLoader();
	void laserEndAnim(CCObject * object);
	bool updateLaser(float dt);
	void setType(int type = -1);
	void setNeedType(int type);
    int calcPercentToKill();

    unsigned int snd;

    
	//laser_wait
	//laser_find
	//laser_start
	//laser_loop

};

#endif