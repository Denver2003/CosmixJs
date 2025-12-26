//
//  Alien.h
//  cosmix
//
//  Created by Den on 15.11.12.
//
//

#ifndef __cosmix__Alien__
#define __cosmix__Alien__

#include <iostream>
#include "LevelHelperLoader.h"
#include "Figure.h"

#define MIN_COLLIDED_CLEAR 4
#define CHECK_TIME_COLLIDE 0.6
#define ANIM_BLINK_TIME_FROM	9.0
#define ANIM_BLINK_TIME_TO		20.0


#define ANIM_STATE_NORMAL 0
#define ANIM_STATE_BLINKING 1
#define ANIM_STATE_BANG 2
#define ANIM_STATE_NEED_TO_CLEAR 3
#define ANIM_STATE_FALL 4


#define CREATE_TYPE_NORMAL 0
#define CREATE_TYPE_SHADOW 1
#define CREATE_TYPE_NEXTFIGURE 2
using namespace std;

class Alien : public CCObject {
public:
    LHSprite * spBody; // спрайт с телом
    
    Figure * figure;
    LHSprite * spEyes; // спрайт с глазами
    LHSprite * spBack; // спрайт с выделением
    bool isPhysics;
    int createType;
    
    
    map<Alien *,int>		collidedAliens;     //// sprites collided with
	int						countCollided;		//// count of collided sprites chain(not only direct)
	int						prevCountCollided;  //// prev count of collided sprites
	float					timeToClear;		//// time to clearing figure
	bool					isClearingSoon;     //// true when we wait time for clearing
	bool					isNeedToClear;      //// true when we need to clear figure
    bool					isNeedToDelete;      //// true when we need to clear figure
    bool                    isCalculated;       /// true where proccess of calculation passed for this
    int                     group;              /// group of collided sprites
	int						animState;
	float					timeToNextBlinking;
    bool                    isPulsing;
    // for falling bonus poins
    // when falling figures start to fall we calculate bonus
    float                   timeToBonus;
    int                     bonusPoints;

    static int observersCount;
    
    
    Alien( LevelHelperLoader * loader, Figure * _figure, bool _isPhysics = true, int _createType = 0 );
    Alien();	
    ~Alien();
    
    LHSprite * getSprite();
	b2Body * getBody();
    void updatePosition();
	void	changeFigure( Figure * _figure );
    
    void removeEyes();
    
    void	collide     ( Alien * alien );
	void	uncollide   ( Alien * alien );
	bool	isCollided  ( Alien * alien );
	void	uncollideAll   ( void );
    
    void    preCalcUnit ();
	void	calcCountCollided(int groupId,map<Alien *,int> *aliens);
    void	setCalcInfo ( int groupId, int count );
	void	animFigure  (int _animState);
	void	genNewTimeToNextBlink();
	void	clearBlink  ();
	void	updateBlink (float tick);
    void    pulseFigure ();
    void    endPulse    (CCNode * node);
    void    spriteEyeBlinkOrFallEnded(CCObject * object);
    void    fallingBonus(float _timeToBonus, int _bonusPoints);
    void	updateFallingBonus (float tick);


private:
    static Alien * alienForFunc;
    static Alien * getForFunc();
	

};


#endif 
