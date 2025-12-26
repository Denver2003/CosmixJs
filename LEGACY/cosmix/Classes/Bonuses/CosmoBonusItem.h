//
//  CosmoBonusItem.h
//  cosmix
//
//  Created by Denis Khlopin on 21.10.13.
//
//

#ifndef __cosmix__CosmoBonusItem__
#define __cosmix__CosmoBonusItem__

#include "LevelHelperLoader.h"  
#include "Bonus.h"
class CosmoBonusSlot;

#define CBI_STATE_READY     0
#define CBI_STATE_COOLDOWN  1
#define CBI_STATE_NOTHING   2

class CosmoBonusItem : public CCObject{
public:
    CosmoBonusItem(int _type);
    ~CosmoBonusItem();
    
    int type;                   // type of bonus
    LHSprite * buttonSprite;    // button sprite(icon)
    LHSprite * waitingSprite;   // sprite with cooldown animation
    CCLabelBMFont * counterLabel;
    string saveName;            // save name
    string spriteName;          // sprite name of bonus


    int state;                  // current state of bonus
    int count;                  // count of bonuses this type
    
    CosmoBonusSlot * slot;      //current slot
    bool isCooldown;
    float cooldownTime;
    float cooldownCurrent;
    
    void load();
    void save();
    void setSlot(CosmoBonusSlot * _slot);
    void onStartGame();
    void onFinishGame();
    void update(float dt);
    void updateState();
    void useItem();
    
    void onEndTouch(CCObject * object);

    
};

#endif /* defined(__cosmix__CosmoBonusItem__) */
