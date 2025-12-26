//
//  shop.h
//  cosmix
//
//  Created by Denis Khlopin on 05.12.13.
//
//

#ifndef __cosmix__shop__
#define __cosmix__shop__

#include "LevelHelperLoader.h"
#include "cocos-ext.h"
#include "button.h"

#define PICKTOUCH_TIME 0.5

#define COST_UPGRADE_1 500
#define COST_UPGRADE_2 1500
#define COST_UPGRADE_3 5000
#define COST_UPGRADE_4 10000
#define COST_UPGRADE_5 30000


#define SIT_UPGRADE 0 /*upgrade item*/
#define SIT_SINGLE_USE 1 /*single use items*/
#define SIT_ONETIME_BUY 2 /*one time buy items*/

#define MAX_UPGRADE 5

USING_NS_CC_EXT;


class ShopItem:public CCObject{
public:
    ShopItem(string _name,int _type,int _itemIndex,LevelHelperLoader * loader);
    ~ShopItem();
    
    
    int itemIndex;
    int singleItemType;
    int type;
    vector<int> costs;
    vector<string> infos;
    int currentIndexOrCount;
    string name;
    LHSprite * background;
    LHSprite * button;
    CCLabelBMFont * info;
    CCLabelBMFont * cost;
    CCLabelBMFont * countItems;
    
    bool isSelected;
    bool isShowBuyButton;


    void updateShopItem();
    void save();
    void load();
    void onItemTouch(CCPoint touchPoint);
    void onPressBuyButton();
    int currentCost();
    string currentInfo();
    int currentIndex();
    int getCountItems();
    bool validPayment();
    
    
    
};

class Shop:public CCLayer{
public:
    bool isActive;
    bool isShowed;
    
    LevelHelperLoader * topLoader;
    LevelHelperLoader * shopLoader;
    CCLayer *           topLayer;
    CCLayer *           shopLayer;
    
    CCScrollView *      scrollView;

    vector<ShopItem*> items;
    vector<vector<string> > infos;
    
    CCLabelBMFont * totalCoins;
    LHSprite * buttonCloseShop;
    
    CCPoint controlTop,controlBottom;

    void update(float dt);
    void updateItems();
    void showShop();
    void hideShop();
    void spriteAnimHasEnded(CCObject * object);
    bool shopIsActive();
    
    
    CCTouch * pickTouch;
    bool isPickTouch;
    float pickTouchTime;
    
    virtual bool ccTouchBegan(CCTouch *pTouch, CCEvent *pEvent);
    virtual void ccTouchEnded(CCTouch *pTouch, CCEvent *pEvent);
    virtual void ccTouchMoved(CCTouch *pTouch, CCEvent *pEvent);
    virtual void ccTouchCancelled(CCTouch *pTouch, CCEvent *pEvent);
    
    
    //-------------------
    ShopItem * getByName(string itemName);
    static bool isUpgradedTo(string itemName,int level);
    
    static string updateText(string _text);
    static Shop * getInstance();
    static void destroyInstance();
private:
    static Shop * instance;
    void init();
    Shop();
    ~Shop();
    
    
};
#endif /* defined(__cosmix__shop__) */
