//
//  CosmoBonuses.h
//  cosmix
//
//  Created by Denis Khlopin on 21.10.13.
//
//

#ifndef __cosmix__CosmoBonuses__
#define __cosmix__CosmoBonuses__

#include "LevelHelperLoader.h"
#include "CosmoBonusItem.h"


class CosmoBonus{
public:
    CosmoBonus(int _type,int _frame,float _cooldownTime);
    ~CosmoBonus();
    //case BT_MEGABOMB
    //case BT_TOUCH_TO_KILL:
    //case BT_GUN:
    int type;
    int count;
    int frame;
    string name;
    string info;
    bool isCooldown;
    float coolDownTime;
    float coolDownTimeRemaining;
    //cooldown 16 frames
    
    
};



class ActiveBonus{
public:
    ActiveBonus();
    ~ActiveBonus();

    void init();
    void start(int _type, float tm);
    void update(float dt);
    void updateLabel();
    void destroy();
    void decCount(int _count);
    
    int type;
    float elapsedTime;
    float fullTime;
    bool isActive;
    int count;
    int bombIndex;
    
    CCLabelBMFont * label;
    LHSprite * sprite;
    
};

class CosmoBonuses : public CCObject{
public:
    vector<CosmoBonusSlot *>    slots; //доступные слоты
    vector<CosmoBonus*>         bonuses;
    vector<CCPoint>             bombPoints;
    bool isShowed;
    bool isHided;
    bool andBackAgain;
    
    bool isBonusUsingNow;
    
    CCPoint activeIconPoint;
    CCPoint activeLabelPoint;
    CCPoint startActiveIconPoint;
    CCPoint startActiveLabelPoint;
    
    ActiveBonus * active;
    
    void loadInfo(LevelHelperLoader * loader);
    
    void save();
    void load();

    void onStartGame();
    void onEndGame();
    
    void updateBonuses();
    void showBonuses();
    void endOfShow(CCNode * node);
    void hideBonuses(bool andBack);
    void endOfHide(CCNode * node);
    void endOfFlyAddBonus(CCNode* node,CCObject * sprite);
    void endOfGunShot(CCNode* node,CCObject * sprite);
    
    
    void update(float dt);
    bool checkTouch(CCPoint touchPoint);
    CosmoBonus * getBonusByType(int bonusType);
    CosmoBonusSlot * getSlotByType(int bonusType);
    
    
    void addBonus(int bonusType,int count,CCPoint pnt,bool animate);
    void useBonus(CosmoBonus * bonus,CCPoint position);

    bool isActiveBonus(int type);
    
    


    
public: //static
    static CosmoBonuses * getInstance();
    static void destroyInstance();
    
    
protected:
    CosmoBonuses();
    ~CosmoBonuses();
    static CosmoBonuses * mInstance;
    
    
};

/// 3 слота для космобонусов
/// описания слота, координаты и т.п.
class CosmoBonusSlot : public CCObject{
public:
    CosmoBonusSlot(int _count);
    ~CosmoBonusSlot();

    void updateCooldownSprite();
    

    
    CosmoBonus * bonus;
    
    int count;
    bool isEmpty;

    
    LHSprite *          spriteIcon;
    LHSprite *          spriteCooldown;
    CCLabelBMFont *     label;
    
    CCPoint showPosition;
    CCPoint showLabelPosition;
    CCPoint hidePosition;
    CCPoint hideLabelPosition;
///static
    
    
    
    
};
#endif /* defined(__cosmix__CosmoBonuses__) */
