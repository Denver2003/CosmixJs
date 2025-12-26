//
//  Bonus.h
//  boltrix
//
//  Created by Den on 12.08.12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#ifndef boltrix_Bonus_h
#define boltrix_Bonus_h

#include "GameScene.h"

#define BT_GRENADE  1
#define BT_POINTS1  2
#define BT_POINTS2  3
#define BT_POINTS3  4
#define BT_COIN     5
#define BT_MEGABOMB 6
#define BT_ROCKET   7
#define BT_TOUCH_TO_KILL   8
#define BT_GUN   9


/// class of description of bonus
class Bonus {
public:
    
    Bonus( int type );
    ~Bonus();
    //params
    int     bonusType;
    string  info;

    static bool    itWasRare;
    static vector<int> rareTypes;
    
    float coolDownTime;         // norepeat time
    // chance of bonus generation by count of current figures
    map<int,int> percentByFigureCount;
    // chance of bonus generation by current level
    map<int,int> percentByLevel;   
    
    bool isAlwaysHide;
/// ???????
	int countTogether;
    
    //help params
    float timeToCooldownOff;

    void makeBonus();
    void makeCooldown();    
    
    
    //static functions and variables
    static vector<Bonus *> bonuses;
    // percent of need to generate bonus when figures cleared
    static map<int, int> percentActionByFigureCleared;
    // speed of bubble flying 
    static map<int,float> bubbleSpeedByLevel;    
    // speed of bubble flying 
    static map<int,int> maxItemsByLevel;
    static vector<CCPoint>   startBubbles;
    
	static bool isInitialized;
    
    static void     initFirst(); // make it only one time!!!
	static void     initBonuses(); //every level start

    static int      GetPercent(map<int, int> percents, int value);
    static float    GetPercent(map<int, float> percents, int value);
    static bool     calcBonuses( int countCleared, CCPoint point, int comboCount, bool isNoCover=false );
    static void     startMegaBonus();
    static void     updateBonuses( float delta );    
    static Bonus *  findByType( int type );
    
    static int typeByName( string typeName );
    static bool isPassByRare(int type);
    static bool isRare(int type);
    
    static bool surpriseBonus();
};


#define BIS_CREATING    0
#define BIS_FLYING      1
#define BIS_USING       2
#define BIS_DELETENG    3
// bonus item
class BonusItem : public cocos2d::CCObject {
public:
    BonusItem(Bonus * bonus,  bool _isHide, CCPoint _startPoint);
    ~BonusItem();
    
    int     bonusType;
    int     state;

    
    Bonus * parentBonus;    
    bool    isHide; // show question
    CCPoint startPoint;
    float   bubbleSpeed;
    
    void *  userData;    
    
    LHSprite * bubbleSprite;
    LHSprite * bonusSprite;
    LHSprite * bubblesSprite;
    
    void CreateItem();
    void endOfFly(CCNode * node);
    void useBonus(CCPoint touchPoint);
	void destroyYorself();
    
    
    bool needToDestroy;
    /// static 
    static vector<BonusItem*> bonusItems;

	static CCRect bubbleRect;
    static CCPoint bubbleEndPoint;
    static float bubbleFlyLength;
    
    
	static void destroyAllItems();
    static void destroyItems();
	static void loadBubbleRect();
    
    static int countType( int type );
    static void updateBonusItems( float delta );
    static BonusItem * checkTouch(CCPoint touchPoint );
    

	/// points in LH
	/// bubbleLeftBottom
	/// bubbleRightTop
	/// bubbleEndPoint
};

#endif
