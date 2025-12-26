#ifndef Boltrix_FigureUnit_h
#define Boltrix_FigureUnit_h

#include "cocos2d.h"
#include "LevelHelperLoader.h"
#include "Figure.h"

#define MIN_COLLIDED_CLEAR 4
#define CHECK_TIME_COLLIDE 1.2
#define ANIM_BLINK_TIME_FROM	9.0
#define ANIM_BLINK_TIME_TO		20.0


#define ANIM_STATE_NORMAL 0
#define ANIM_STATE_BLINKING 1
#define ANIM_STATE_BANG 2
#define ANIM_STATE_NEED_TO_CLEAR 3


USING_NS_CC;

class CFigureUnit : public CCObject{
public:

	CFigureUnit( LHSprite * sprite, Figure * _figureTemplate );
	~CFigureUnit();
	void	collide( LHSprite * sprite );
	void	uncollide( LHSprite * sprite );
	bool	isCollided( LHSprite * sprite );
    void    preCalcUnit();
	void	calcCountCollided(int groupId,map<LHSprite *,int> *sprites);
    void	setCalcInfo( int groupId, int count );
    
	
	

	LHSprite *				parentSprite;		//// sprite holder jf this unit
    
	map<LHSprite *,int>		collidedSprites;	//// sprites collided with
	int						countCollided;		//// count of collided sprites chain(not only direct)
	int						prevCountCollided;  //// prev count of collided sprites
	float					timeToClear;		//// time to clearing figure
	bool					isClearingSoon;     //// true when we wait time for clearing
	bool					isNeedToClear;      //// true when we need to clear figure
    bool					isNeedToDelete;      //// true when we need to clear figure
    bool                    isCalculated;       /// true wher proccess of calculation passed for this figure
    int                     group;              /// group of collided sprites
	Figure *                figureTemplate;

	
	int						animState;
	float					timeToNextBlinking;
    
    bool                    isPulsing;
	
	void	animFigure(int _animState);
	void	genNewTimeToNextBlink();
	void	clearBlink();
	void	updateBlink(float tick);
    void    pulseFigure();
	void    changeParentSprite( LHSprite * sprite );

	static void collide( LHSprite * spriteA, LHSprite * spriteB );
	static void uncollide( LHSprite * spriteA, LHSprite * spriteB );
	static CFigureUnit * unitFromSprite( LHSprite * sprite );
	static CFigureUnit * createUnitForSprite( LHSprite * sprite, Figure * _figureTemplate );
	static bool clearUnitFromSprite( LHSprite * sprite );
    

    /// all sprite array work
    static  void initUnits();    
    static  void clearSprites(void);
    static  void addSprite(LHSprite * sprite);
    static  void removeSprite(LHSprite * sprite);    
    
    static void preCalculate();
    static void calcGroup(CFigureUnit * unit, int groupId);
    static void calculate();
    static void updateTime( float tick );
    static vector<LHSprite *>  spritesByGroup(int groupId);    
    static void setClearByGroup(int groupId);
    static void setClearByColor(int tag, int count = 4);
    static int getCountByTag(int tag);    
    static Figure * getMaxFiguresOnLevel();
    
    static void removeCollidedSprite();
	static void removeAllSprite(bool clear = false);

	static bool	rectCollideWhithSprites(CCRect rc);
    
    static vector<LHSprite *>  allSprites;
    static map<LHSprite *, CFigureUnit *>  units;    
    
    
    

};



#endif