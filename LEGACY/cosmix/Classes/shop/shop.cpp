//
//  shop.cpp
//  cosmix
//
//  Created by Denis Khlopin on 05.12.13.
//
//

#include "shop.h"
#include "GameScene.h"
#include "Game.h"
#include "LevelLoader.h"
#include "params.h"
#include "Bonus.h"
#include "CosmoBonuses.h"
#include "Test.h"

Shop * Shop::instance = NULL;

ShopItem::ShopItem(string _name,int _type,int _itemIndex,LevelHelperLoader * loader)
{
    singleItemType = -1;
    name        = _name;
    type        = _type;
    itemIndex   = _itemIndex;
    costs.push_back(COST_UPGRADE_1);
    costs.push_back(COST_UPGRADE_2);
    costs.push_back(COST_UPGRADE_3);
    costs.push_back(COST_UPGRADE_4);
    costs.push_back(COST_UPGRADE_5);
    if (Shop::getInstance()->infos.size()>0 && _itemIndex>=0 && _itemIndex<Shop::getInstance()->infos.size()) {
        switch (type) {
            case SIT_UPGRADE:
            {
                for (int i = 0; i < MAX_UPGRADE; i++) {
                    if (i>=0 && i < Shop::getInstance()->infos[_itemIndex].size()) {
                        infos.push_back( Shop::updateText( Shop::getInstance()->infos[_itemIndex][i] ));
                    }
                }
            }
                break;
            case SIT_SINGLE_USE:
            {
                if (Shop::getInstance()->infos[_itemIndex].size()>0) {
                    infos.push_back(  Shop::updateText( Shop::getInstance()->infos[_itemIndex][0] ));
                }
                costs[0] = 1000;
            }
                break;
                
            default:
                break;
        }
        
    }
    
    if (loader) {
        char spriteName[20];
        LHSprite * temp;
        sprintf(spriteName, "back_%i",itemIndex+1);
        background = loader->spriteWithUniqueName(spriteName);
        if (background) {
            background->prepareAnimationNamed("selected", "shop.pshs");
            background->setFrame(0);
        }
        
        sprintf(spriteName, "button_%i",itemIndex+1);
        button = loader->spriteWithUniqueName(spriteName);
        if (button) {
            if (type==SIT_UPGRADE) {
                button->prepareAnimationNamed("upgrades", "shop.pshs");
            }else if (type==SIT_SINGLE_USE){
                button->prepareAnimationNamed("singlebuy", "shop.pshs");
            }
            button->setFrame(0);
        }
        
        sprintf(spriteName, "info_%i",itemIndex+1);
        temp = loader->spriteWithUniqueName(spriteName);
        info = CCLabelBMFont::create(infos[0].c_str(),"metro.fnt");
        info->setPosition(temp->getPosition());
        Shop::getInstance()->shopLayer->addChild(info,6);
        
        sprintf(spriteName, "cost_%i",itemIndex+1);
        temp = loader->spriteWithUniqueName(spriteName);
        char cst[10];
        sprintf(cst,"$%i",costs[4]);
        cost = CCLabelBMFont::create(cst,"menu.fnt");
        cost->setPosition(temp->getPosition());
        Shop::getInstance()->shopLayer->addChild(cost,6);
        
        
        countItems  = NULL;
        
        if (type == SIT_SINGLE_USE) {
            sprintf(spriteName, "count_%i",itemIndex+1);
            temp = loader->spriteWithUniqueName(spriteName);
            countItems = CCLabelBMFont::create("0","metro.fnt");

            countItems->setPosition(temp->getPosition());
            Shop::getInstance()->shopLayer->addChild(countItems,6);
        }
        isSelected = false;
    }
    
    load();
    updateShopItem();
    //LevelLoader::getInstance()->getCurLevel()->bonuses
    
}

ShopItem::~ShopItem()
{
    save();
}
void ShopItem::updateShopItem()
{
    bool isValidPayment = validPayment();
    char txt[60];
    if (cost) {
        if (currentCost()==999999999) {
            sprintf(txt,"");
        }else{
            sprintf(txt,"$%i",currentCost());

        }
        cost->setString(txt);
    }
    if (info) {
        sprintf(txt,"%s",currentInfo().c_str());
        info->setString(txt);
    }
    
    if (isSelected) {
        if (background) {
            background->setFrame(1);
        }
        switch (type) {
            case SIT_UPGRADE:
            {
                if (button) {
                    button->setFrame(currentIndex()<MAX_UPGRADE?(isValidPayment?6:currentIndex()):5); //touch to buy
                }
            }
            break;
            case SIT_SINGLE_USE:
            {
                if (button) {
                    button->setFrame(isValidPayment?1:0); //touch to buy
                }
                if (countItems) {
                    sprintf(txt, "%i",getCountItems());
                    countItems->setString(txt);
                    countItems->setVisible(isValidPayment?false:true);
                }
            }
                break;
        }
        
    }else{
        if (background) {
            background->setFrame(0);
        }
        switch (type) {
            case SIT_UPGRADE:
            {
                if (button) {
                    button->setFrame(currentIndex()<MAX_UPGRADE?currentIndex():5); //touch to buy
                    
                }
            }
                break;
            case SIT_SINGLE_USE:
            {
                if (button) {
                    button->setFrame(0); //touch to buy
                }
                if (countItems) {
                    sprintf(txt, "%i",getCountItems());
                    countItems->setVisible(true);
                    countItems->setString(txt);
                }
                
                
            }
                break;
        }
        
    }




    
}
void ShopItem::save()
{
    CCUserDefault::sharedUserDefault()->setIntegerForKey(name.c_str(),currentIndexOrCount);
    CCUserDefault::sharedUserDefault()->flush();
}
void ShopItem::load()
{
    currentIndexOrCount = CCUserDefault::sharedUserDefault()->getIntegerForKey(name.c_str(),0);
}
int ShopItem::currentCost()
{
    int i = currentIndex();
    if (i>=0 && i<costs.size()) {
        return costs[i];
    }
    return 999999999;
}
string ShopItem::currentInfo()
{
    int i = currentIndex();
    if (i>=0 && i<infos.size()) {
        return infos[i];
    }
    return "";
}

int ShopItem::currentIndex()
{
    switch (type) {
        case SIT_SINGLE_USE: return 0;
        case SIT_UPGRADE: return currentIndexOrCount;
        default:return 0;
            break;
    }
}

int ShopItem::getCountItems()
{
    switch (type) {
        case SIT_SINGLE_USE:
        {
            if (singleItemType == -1) {
                return currentIndexOrCount;
            }else{
                CosmoBonus * item = CosmoBonuses::getInstance()->getBonusByType(singleItemType);
                if (item) {
                    currentIndexOrCount = item->count;
                    return item->count;
                }
            }
        }
        case SIT_UPGRADE: return 0;
        default:return 0;
        break;
    }
}

void ShopItem::onItemTouch(CCPoint touchPoint)
{
    bool prevSelected = isSelected;
    bool prevShowBuyButton = isShowBuyButton;
    for (int i = 0; i < Shop::getInstance()->items.size(); i++) {
        Shop::getInstance()->items[i]->isSelected = false;
        Shop::getInstance()->items[i]->isShowBuyButton = false;
    }
    isSelected = true;
    isShowBuyButton = true;
    if (prevSelected) {
        //show BUY button
        if (prevShowBuyButton) {
            //touch the buy BUTTON if touch to button
            if (button) {
                if (button->boundingBox().containsPoint(touchPoint)) {
                    if (validPayment()) {
                        onPressBuyButton();
                    }
                }else{
                    isSelected = false;
                    isShowBuyButton = false;
                }
            }
        }
    }else{

    }
}

bool ShopItem::validPayment()
{
    int _totalCoins =params::getInstance()->totalCoins;
    int _currentCost =currentCost();
    if ( _totalCoins >=_currentCost  ){
        switch (type) {
            case SIT_UPGRADE:
                if (currentIndex()<MAX_UPGRADE) {
                    return true;
                }
                break;
                case SIT_SINGLE_USE:
                return true;
                break;
            default:
                break;
        }
    }
    return false;
}
void ShopItem::onPressBuyButton(){
    if (validPayment()) {
        
        if (button) {
            button->runAction(CCSequence::create(
                                                 CCScaleTo::create(0.1, 0.9, 0.9),
                                                 CCScaleTo::create(0.1, 1.1, 1.4),
                                                 CCScaleTo::create(0.1, 1, 1),
                                                 NULL
                                                 )
                              );
        }
        
        params::getInstance()->totalCoins -= currentCost();
        params::getInstance()->saveAll();
        
        currentIndexOrCount++;
        if (type == SIT_SINGLE_USE) {
            CCPoint pnt;
            CosmoBonuses::getInstance()->addBonus(singleItemType, 1, pnt, false);
            CosmoBonuses::getInstance()->save();
        }
        save();
        Shop::getInstance()->updateItems();
    }
}

Shop::Shop()
{
    //CCLayer::autorelease();
    retain();
}
Shop::~Shop()
{
    
}
void Shop::init()
{
    pickTouch = NULL;
    buttonCloseShop = NULL;

    isPickTouch = false;
    pickTouchTime = 0;
    
    
    infos = LevelLoader::getInstance()->getCurLevel()->infos;
    
    isActive = false;
    isShowed = false;
    CCSize winSize = GameScene::gameScene->winSize;
    CCPoint top,bottom,center;
    // create top layer for shop
    topLayer = CCLayer::create();
    
    GameScene::gameScene->addChild(topLayer,6);
    //loading shop_top file for header and footer
    topLoader = new LevelHelperLoader("shop_top.plhs");
    topLoader->addObjectsToWorld(Game::getWorld(), topLayer);
    LHSprite * temp = topLoader->spriteWithUniqueName("shop_top_point");
    if (temp) {
        top = temp->getPosition();
        temp->removeSelf();
    }
    temp = topLoader->spriteWithUniqueName("shop_bottom_point");
    if (temp) {
        bottom = temp->getPosition();
        temp->removeSelf();
    }
    temp = topLoader->spriteWithUniqueName("shop_center_point");
    if (temp) {
        center = temp->getPosition();
        temp->removeSelf();
    }
    
    CCSize topRelativeSize,bottomRelativeSize;
    topRelativeSize.height = top.y - winSize.height;
    bottomRelativeSize.height = bottom.y;
    
    
    CCArray * sprites = topLoader->allSprites();
    if (sprites) {
        for(unsigned int i=0; i < sprites->count(); i++ ){
			LHSprite * sprite = (LHSprite *)sprites->objectAtIndex( i );
			if(sprite){
                CCPoint pnt = sprite->getPosition();
                if (pnt.y > center.y) {
                    pnt.y = pnt.y - topRelativeSize.height;
                }else{
                    pnt.y = pnt.y - bottomRelativeSize.height;
                }
                sprite->setPosition(pnt);
			}
		}
    }

    temp = topLoader->spriteWithUniqueName("top_control");
    if (temp) {
        controlTop = temp->getPosition();
        temp->removeSelf();
    }
    temp = topLoader->spriteWithUniqueName("bottom_control");
    if (temp) {
        controlBottom = temp->getPosition();
        temp->removeSelf();
    }
    
    temp = topLoader->spriteWithUniqueName("totalCoins");
    totalCoins = CCLabelBMFont::create("$0","menu.fnt");
    totalCoins->setPosition(temp->getPosition());
    topLayer->addChild(totalCoins,6);
    
    buttonCloseShop = topLoader->spriteWithUniqueName("buttonClose");
    if (buttonCloseShop) {
        buttonCloseShop->prepareAnimationNamed("reply_press", "ui.pshs");
        buttonCloseShop->setFrame(0);
        
        CCNotificationCenter::sharedNotificationCenter()->addObserver(this,
                                                                      callfuncO_selector(Shop::spriteAnimHasEnded),
                                                                      LHAnimationHasEndedNotification,
                                                                      buttonCloseShop);
        
    }
  // расчитываем высоту скроллящегося окна магазина
    float shopScrollWidth =  controlTop.y - controlBottom.y;
    
    // create scroll sub layer
    shopLayer = this; //CCLayer::create();
    shopLoader = new LevelHelperLoader("shop.plhs");
    shopLoader->addObjectsToWorld(Game::getWorld(), shopLayer);
    temp = shopLoader->spriteWithUniqueName("shop_top_point");
    if (temp) {
        top = temp->getPosition();
        temp->removeSelf();
    }
    temp = shopLoader->spriteWithUniqueName("shop_bottom_point");
    if (temp) {
        bottom = temp->getPosition();
        temp->removeSelf();
    }
    bottomRelativeSize.height = bottom.y;
    sprites = shopLoader->allSprites();
    if (sprites) {
        for(unsigned int i=0; i < sprites->count(); i++ ){
			LHSprite * sprite = (LHSprite *)sprites->objectAtIndex( i );
			if(sprite){
                CCPoint pnt = sprite->getPosition();
                pnt.y = pnt.y - bottomRelativeSize.height;
                sprite->setPosition(pnt);
			}
		}
    }

    winSize.height = abs(top.y - bottom.y);
    shopLayer->setContentSize( CCSizeMake( winSize.width, winSize.height ) ); ///размер
    
    
    scrollView = CCScrollView::create();
    scrollView->retain();
    scrollView->setContentSize( CCSizeMake ( shopLayer->getContentSize().width,  shopLayer->getContentSize().height ) );
    //scrollView->setContentSize( CCSizeMake ( 100,  100 ) );
    scrollView->setDirection( kCCScrollViewDirectionVertical );
    scrollView->setPosition( ccp( 0,controlBottom.y) );
    scrollView->setContainer( shopLayer );
    scrollView->setViewSize(CCSizeMake(winSize.width, shopScrollWidth));
    

    scrollView->setContentOffset( scrollView->minContainerOffset() );
    
    
    scrollView->setBounceable(false);
    
    
    topLayer->addChild(scrollView,6);
    
    topLayer->setVisible(false);


    
    ///create shop items
    ShopItem * item;
    ///1 coins upgrade
    item = new ShopItem("coins",SIT_UPGRADE,0,shopLoader);
    items.push_back(item);
    ///2 bonuses upgrade
    item = new ShopItem("bonuses",SIT_UPGRADE,1,shopLoader);
    items.push_back(item);
    ///3 grenades upgrade
    item = new ShopItem("grenades",SIT_UPGRADE,2,shopLoader);
    items.push_back(item);
    ///4 cosmometer upgrade
    item = new ShopItem("cosmometer",SIT_UPGRADE,3,shopLoader);
    items.push_back(item);

    
    ///5 machine gun upgrade
    item = new ShopItem("machine gun",SIT_SINGLE_USE,4,shopLoader);
    item->singleItemType = BT_GUN;
    items.push_back(item);
    ///6 touch to kill upgrade
    item = new ShopItem("touch to kill",SIT_SINGLE_USE,5,shopLoader);
    item->singleItemType = BT_TOUCH_TO_KILL;
    items.push_back(item);

    

/*

 
 
    

    
    
    //scrollView->setAnchorPoint(ccp(0,0));
    
    GameScene::gameScene->addChild(scrollView,6);
    
    scrollView->setContentOffset( scrollView->minContainerOffset() );
    

    scrollView->setBounceable(false);
    
    //scrollView->setVisible(false);
    
    
     GameScene::gameScene->setTouchEnabled(false);
    */
    
//    GameScene::gameScene->loader;
}

Shop * Shop::getInstance()
{
    if (!Shop::instance) {
        Shop::instance = new Shop();
        Shop::instance->init();
    }
    return Shop::instance;
}

void Shop::destroyInstance()
{
    if (Shop::instance) {
        delete Shop::instance;
        Shop::instance = NULL;
    }
}

bool Shop::ccTouchBegan(CCTouch *pTouch, CCEvent *pEvent)
{
    if (!isActive) {
        return false;
    }
    
    pickTouch = pTouch;
    pickTouchTime = PICKTOUCH_TIME;

    
    /*CCPoint location = CCDirector::sharedDirector()->convertToGL( pTouch->getLocationInView() );
    
    
    location = topLayer->convertTouchToNodeSpace(pTouch);
    if (controlTop.y > location.y && controlBottom.y < location.y) {
        location = this->convertTouchToNodeSpace(pTouch);

        //CCLog("CCTouch Y=%f", location.y);
    }
*/
    return true;
}
void Shop::ccTouchEnded(CCTouch *pTouch, CCEvent *pEvent)
{
    if (!isActive) {
        return;
    }
    CCPoint location = CCDirector::sharedDirector()->convertToGL( pTouch->getLocationInView() );
    
    
    location = topLayer->convertTouchToNodeSpace(pTouch);

    if (controlTop.y > location.y && controlBottom.y < location.y) {
        if (isPickTouch) {
            pickTouch = NULL;
            
            location = this->convertTouchToNodeSpace(pTouch);
            //CCLog("CCTouch Y=%f", location.y);
            for (int i = 0; i < items.size(); i++) {
                if (items[i]->background) {
                    if (items[i]->background->boundingBox().containsPoint(location)) {
                        items[i]->onItemTouch(location);
                        updateItems();
                    }
                }
            }
            
        }
    }else{
        if (isPickTouch) {
            pickTouch = NULL;
            if (buttonCloseShop) {
                if (buttonCloseShop->boundingBox().containsPoint(location)) {
                    buttonCloseShop->setFrame(0);
                    buttonCloseShop->playAnimation();
                    isActive = false;
                    //hideShop();
                }
            }
            

        }// check close shop button
    }

    
    if (pickTouch) {
        pickTouch = NULL;
    }
    
    //CCLog("CCTouch ended in %f, %f", location.x,location.y);
    //CCLog("Location ended in %f, %f", pTouch->getLocationInView().x,pTouch->getLocationInView().y);

    
    
}
void Shop::ccTouchMoved(CCTouch *pTouch, CCEvent *pEvent)
{
    
}

void Shop::ccTouchCancelled(CCTouch *pTouch, CCEvent *pEvent)
{
    
}

bool Shop::shopIsActive()
{
    if (isActive) {
        return true;
    }
    return false;
}

void Shop::showShop()
{
    //GameScene::gameScene->setTouchEnabled(false);

    //setTouchEnabled(true);
    //topLayer->setTouchEnabled(true);
    topLayer->setVisible(true);
    //CCDirector::sharedDirector()->getTouchDispatcher()->addStandardDelegate(this, 0 );

    schedule(schedule_selector(Shop::update));
    isActive = true;
    isShowed = true;
    updateItems();
    
}

void Shop::spriteAnimHasEnded(CCObject * object)
{
    LHSprite * _sprite = dynamic_cast<LHSprite*>(object);
    if (_sprite == buttonCloseShop) {
        hideShop();
    }
}
void Shop::hideShop()
{
    //GameScene::gameScene->setTouchEnabled(true);
    //CCDirector::sharedDirector() -> getTouchDispatcher() ->removeDelegate(this); //addTargetedDelegate( this, 0, true );
    //setTouchEnabled(false);
    isActive = false;
    isShowed = false;
    topLayer->setVisible(false);
    unschedule(schedule_selector(Shop::update));
    
    char text[30];
    params * pr = params::getInstance();
    sprintf( text, "Total Coins: %i", pr->totalCoins);
    GameScene::gameScene->pauseMenu->setLabelText("totalCoins", text);
    //sprintf( text, "Total Coins: %i", pr->totalCoins);
    GameScene::gameScene->gameoverMenu->setLabelText("totalCoins", text);

    
}

void Shop::updateItems()
{
    // first, we update money
    char text[30];
    sprintf(text,"$%i",params::getInstance()->totalCoins );
    if (totalCoins) {
        totalCoins->setString(text);
    }
    
    for (int i = 0; i < items.size(); i++) {
        items[i]->updateShopItem();
    }
    

    
}

void Shop::update(float dt)
{
    if(pickTouch){
        isPickTouch = true;
        pickTouchTime-=dt;
        if (pickTouchTime<=0) {
            pickTouch = NULL;
            isPickTouch = false;
        }
    }else{
        isPickTouch = false;
    }
}

std::string Shop::updateText(std::string _text)
{
    std::string text = "";
    bool nextKeyChar = false;
    std::string tail = "";
    // char temp[13];
    
    for (int i = 0; i < _text.size(); i++) {
        char ch = _text[i];
        if (nextKeyChar) {
            if (ch == 'n') {
                tail = "\n";
            }else{
                i--;
            }
            text = text + tail;
            tail = "";
            nextKeyChar = false;
            
        }else{
            if (ch == '\\') {
                tail = ch;
                nextKeyChar = true;
                
            }else {
                text = text + ch;
            }
        }
        
    }
    return text;
}

ShopItem * Shop::getByName(string itemName)
{
    for (int i = 0; i < items.size(); i++) {
        if (items[i]->name == itemName) {
            return items[i];
        }
    }
    return NULL;
}

bool Shop::isUpgradedTo(string itemName,int level)
{
    ShopItem * item = Shop::getInstance()->getByName(itemName);

    if (item) {
        if (level <= item->currentIndex()) {
            return true;
        }
    }
    return false;
}

