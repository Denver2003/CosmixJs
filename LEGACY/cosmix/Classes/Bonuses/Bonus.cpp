//
//  Bonus.cpp
//  boltrix
//
//  Created by Den on 12.08.12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#include "Bonus.h"
#include "Effect.h"
#include "AliensManager.h"
#include "LevelLoader.h"
#include "Game.h"
#include "sounds.h"
#include "PlayEvents.h"
#include "CosmoBonuses.h"
#include "shop.h"
#include "Test.h"

//static 
vector<Bonus *>     Bonus::bonuses;
map<int, int>       Bonus::percentActionByFigureCleared;
map<int,float>      Bonus::bubbleSpeedByLevel;   
map<int,int>        Bonus::maxItemsByLevel;
bool				Bonus::isInitialized = false;
vector<CCPoint>   Bonus::startBubbles;
bool                Bonus::itWasRare;
vector<int>         Bonus::rareTypes;


vector<BonusItem*>  BonusItem::bonusItems;
CCRect				BonusItem::bubbleRect;
CCPoint             BonusItem::bubbleEndPoint;
float               BonusItem::bubbleFlyLength;




//------
Bonus::Bonus( int type ){
    bonusType           = type;
    timeToCooldownOff   = 0;
    coolDownTime        = 0;
    isAlwaysHide        = false;
	countTogether		= 1;
    
}
//------
Bonus::~Bonus(){
    
}
//------
void Bonus::initBonuses(){
	if( !Bonus::isInitialized ){
		Bonus::initFirst();
		Bonus::isInitialized = true;
	}

	BonusItem::destroyAllItems();
	BonusItem::loadBubbleRect();
    Bonus::bonuses.clear();
    Bonus::bonuses = LevelLoader::getInstance()->getCurLevel()->bonuses;
}

int Bonus::typeByName( string typeName )
{
    if (typeName == "GRENADE") {
        return BT_GRENADE;
    }else if (typeName == "POINTS1") {
        return BT_POINTS1;
    }else if (typeName == "POINTS2") {
        return BT_POINTS2;
    }else if (typeName == "POINTS3") {
        return BT_POINTS3;
    }else if (typeName == "COIN") {
        return BT_COIN;
    }else if (typeName == "MEGABOMB") {
        return BT_MEGABOMB;
    }else if (typeName == "ROCKET") {
        return BT_ROCKET;
    }else if (typeName == "TOUCH_TO_KILL") {
        return BT_TOUCH_TO_KILL;
    }else if (typeName == "GUN") {
        return BT_GUN;
    }

    return -1;
    

}
//------
void Bonus::initFirst(){
    /// set the percent of bonus generation chance table
    Bonus::percentActionByFigureCleared.insert(make_pair(4, 30));
    //Bonus::percentActionByFigureCleared.insert(make_pair(4, 100));///temp
    
    Bonus::percentActionByFigureCleared.insert(make_pair(5, 50));
    Bonus::percentActionByFigureCleared.insert(make_pair(6, 90));    
    Bonus::percentActionByFigureCleared.insert(make_pair(7, 100));  
    Bonus::percentActionByFigureCleared.insert(make_pair(999999, 100));  
    
    
    Bonus::bubbleSpeedByLevel.insert(make_pair(1, 7.0));
    Bonus::bubbleSpeedByLevel.insert(make_pair(3, 5.0));
    Bonus::bubbleSpeedByLevel.insert(make_pair(6, 4.5));    
    Bonus::bubbleSpeedByLevel.insert(make_pair(8, 4.3));        
    Bonus::bubbleSpeedByLevel.insert(make_pair(10, 4.1));            
    Bonus::bubbleSpeedByLevel.insert(make_pair(12, 4.0));
    Bonus::bubbleSpeedByLevel.insert(make_pair(999999, 4.0));
    
    
    Bonus::maxItemsByLevel.insert(make_pair(1, 2));
    Bonus::maxItemsByLevel.insert(make_pair(4, 3));
    Bonus::maxItemsByLevel.insert(make_pair(8, 4));
    Bonus::maxItemsByLevel.insert(make_pair(10, 5));
    Bonus::maxItemsByLevel.insert(make_pair(999999, 5));
    
    rareTypes.push_back(BT_MEGABOMB);
    rareTypes.push_back(BT_GUN);
    rareTypes.push_back(BT_TOUCH_TO_KILL);
    
    /*

    // ROCKET
    Bonus * bonus = new Bonus(BT_ROCKET);
    bonus->coolDownTime = 20;
    bonus->isAlwaysHide = true;
    // by figurecount
    bonus->percentByFigureCount.insert(make_pair(1, 90));
    bonus->percentByFigureCount.insert(make_pair(8, 70));
    bonus->percentByFigureCount.insert(make_pair(12, 50)); //50));    
    bonus->percentByFigureCount.insert(make_pair(13, 40)); //50));        
    bonus->percentByFigureCount.insert(make_pair(14, 30)); //50));            
    bonus->percentByFigureCount.insert(make_pair(15, 20)); //50));                
    bonus->percentByFigureCount.insert(make_pair(16, 10)); //50));                    
    bonus->percentByFigureCount.insert(make_pair(17, 0)); //50));                        
    bonus->percentByFigureCount.insert(make_pair(20, 0));//5));        
    bonus->percentByFigureCount.insert(make_pair(99999, 0));        
    // levels
   
    bonuses.push_back(bonus);

    // GRENADE
    bonus = new Bonus(BT_GRENADE);
    bonus->coolDownTime = 60;
    // realese
//    bonus->coolDownTime = 300;
    
    bonus->isAlwaysHide = false;
    // levels
    bonus->percentByLevel.insert(make_pair(1, 100));
    bonus->percentByLevel.insert(make_pair(3, 50));
    bonus->percentByLevel.insert(make_pair(5, 45));
    bonus->percentByLevel.insert(make_pair(7, 40));
    bonus->percentByLevel.insert(make_pair(10, 35));    
    bonus->percentByLevel.insert(make_pair(11, 30));    
    bonus->percentByLevel.insert(make_pair(12, 25));    
    bonus->percentByLevel.insert(make_pair(13, 20));    
    bonus->percentByLevel.insert(make_pair(14, 15));    
    bonus->percentByLevel.insert(make_pair(99999, 10));    
    
    bonuses.push_back(bonus);
    
    // POINTS1
    bonus = new Bonus(BT_POINTS1);
    bonus->coolDownTime = 1;
    bonus->isAlwaysHide = false;
    // levels
    bonus->percentByLevel.insert(make_pair(1, 100));
    bonus->percentByLevel.insert(make_pair(2, 80));
    bonus->percentByLevel.insert(make_pair(3, 70));
    bonus->percentByLevel.insert(make_pair(5, 60));
    bonus->percentByLevel.insert(make_pair(8, 50));    
    bonus->percentByLevel.insert(make_pair(10, 40));    
    bonus->percentByLevel.insert(make_pair(12, 40));    
    bonus->percentByLevel.insert(make_pair(15, 40));    
    bonus->percentByLevel.insert(make_pair(99999, 40));    
    
    
	bonus->countTogether = 3;

    bonuses.push_back(bonus);

    // POINTS2
    bonus = new Bonus(BT_POINTS2);
    bonus->coolDownTime = 3;
    bonus->isAlwaysHide = false;
    // levels
    bonus->percentByLevel.insert(make_pair(1, 0));
    bonus->percentByLevel.insert(make_pair(2, 20));
    bonus->percentByLevel.insert(make_pair(3, 20));
    bonus->percentByLevel.insert(make_pair(5, 30));
    bonus->percentByLevel.insert(make_pair(8, 35));    
    bonus->percentByLevel.insert(make_pair(10, 40));    
    bonus->percentByLevel.insert(make_pair(12, 35));    
    bonus->percentByLevel.insert(make_pair(15, 33));    
    bonus->percentByLevel.insert(make_pair(99999, 33));    

	bonus->countTogether = 2;
    
    bonuses.push_back(bonus);

    // POINTS3
    bonus = new Bonus(BT_POINTS3);
    bonus->coolDownTime = 5;
    bonus->isAlwaysHide = false;
    // levels
    bonus->percentByLevel.insert(make_pair(1, 0));
    bonus->percentByLevel.insert(make_pair(2, 0));
    bonus->percentByLevel.insert(make_pair(3, 10));
    bonus->percentByLevel.insert(make_pair(5, 10));
    bonus->percentByLevel.insert(make_pair(8, 15));    
    bonus->percentByLevel.insert(make_pair(10, 20));    
    bonus->percentByLevel.insert(make_pair(12, 30));    
    bonus->percentByLevel.insert(make_pair(15, 33));    
    bonus->percentByLevel.insert(make_pair(99999, 33));    
    
    
    bonuses.push_back(bonus);
    
    // COIN
    bonus = new Bonus(BT_COIN);
    bonus->coolDownTime = 10;
    bonus->isAlwaysHide = false;
    // levels
    bonus->percentByLevel.insert(make_pair(1, 10));
    bonus->percentByLevel.insert(make_pair(2, 15));    
    bonus->percentByLevel.insert(make_pair(3, 20));
    bonus->percentByLevel.insert(make_pair(5, 25));
    bonus->percentByLevel.insert(make_pair(7, 28));
    bonus->percentByLevel.insert(make_pair(10, 30));    
    bonus->percentByLevel.insert(make_pair(99999, 30));    
    
    
    bonuses.push_back(bonus);

    // MEGABOMB
    bonus = new Bonus(BT_COIN);
    bonus->coolDownTime = 1800;
    bonus->isAlwaysHide = true;
    // levels
    bonus->percentByLevel.insert(make_pair(10, 1));
    bonus->percentByLevel.insert(make_pair(20, 2));
    bonus->percentByLevel.insert(make_pair(99999, 2));
    
    bonuses.push_back(bonus);
     */
}

bool Bonus::isPassByRare(int type)
{
    if (isRare(type) && itWasRare) {
        return false;
    }
    return true;
}
bool Bonus::isRare(int type)
{
    for (int i=0; i < rareTypes.size(); i++) {
        if (type == rareTypes[i]) {
            return true;
        }
    }
    return false;
}


bool Bonus::surpriseBonus(){
    if (Shop::isUpgradedTo("bonuses", 3)) {
        if(CCRANDOM_0_1()*100 < 3)
        {
            CCPoint point;
        
            point.x = (CCRANDOM_0_1()*BonusItem::bubbleRect.size.width) + BonusItem::bubbleRect.origin.x;
            point.y = (CCRANDOM_0_1()*BonusItem::bubbleRect.size.height/2) + BonusItem::bubbleRect.origin.y;
     
            Bonus::calcBonuses( 4, point , 2 );
            return true;
        
        }
    }
    return false;
}

//------
bool Bonus::calcBonuses( int countCleared, CCPoint point , int comboCount, bool isNoCover ){

    int curCountCleared = countCleared;
    
    if (countCleared < 4) {
        return false;
    }
    
    curCountCleared = curCountCleared + comboCount;
    
    int curLevel = LevelLoader::getInstance()->curStageNumber;
    
    int maxItems = Bonus::GetPercent( Bonus::maxItemsByLevel, curLevel );
    if (isNoCover) {
        maxItems=10;
    }
    
    if (BonusItem::bonusItems.size() >= maxItems ) {
        return false;
    }
    
    int curPercent = Bonus::GetPercent(percentActionByFigureCleared, curCountCleared );
    

    if (Shop::isUpgradedTo("bonuses", 4)) {
        curPercent = 101;
    }else
    if (Shop::isUpgradedTo("bonuses", 2)) {
        curPercent = curPercent * 1.3;
    }else  if (Shop::isUpgradedTo("bonuses", 1)) {
        curPercent = curPercent * 1.15;
    }
    
    
    //curPercent = curPercent ;
    
    if( (CCRANDOM_0_1() * 100) > curPercent )
        return false;
    
    vector<int> chances;
    
    
    vector< Bonus* >::iterator it = bonuses.begin();
    for (; it != bonuses.end(); it++) {
        Bonus * curBonus = *it;
        int percent = 0;
        if (curBonus) {
            if ( ((curBonus->timeToCooldownOff <= 0) || (curBonus->timeToCooldownOff <= 10 && isNoCover)) && (isPassByRare(curBonus->bonusType))) {
                if (curBonus->percentByLevel.size() > 0) {
                    percent = Bonus::GetPercent( curBonus->percentByLevel, curLevel);
                    if (curBonus->bonusType == BT_COIN) {
                        if (Shop::isUpgradedTo("coins", 2)) {
                            percent = percent * 2;
                        }else if(Shop::isUpgradedTo("coins", 1)) {
                            percent = percent * 1.5;
                        }
                    }
                    
                    if (curBonus->bonusType == BT_GRENADE) {
                        if (Shop::isUpgradedTo("grenades", 3)) {
                            percent = percent * 2;
                        }else if (Shop::isUpgradedTo("grenades", 2)) {
                            percent = percent * 1.3;
                        }else if(Shop::isUpgradedTo("grenades", 1)) {
                            percent = percent * 1.15;
                        }
                    }
                    
                }
                if (curBonus->percentByFigureCount.size() > 0) {
                    int percentByCount = Bonus::GetPercent( curBonus->percentByFigureCount, curLevel);
                    percent = percent + percentByCount;

/*					if( curBonus->percentByLevel.size() == 0 ){
						percent = percentByCount;
					}else
                    if ( percent > percentByCount ) {
                       percent = percentByCount; 
                    }
 */
                }
            }
            for (int i = 0; i < percent; i++) {
                chances.push_back(curBonus->bonusType);
            }
        }
        
    }
    
    if (chances.size() == 0) {
        return false;
    }
    
    int maxPercent = 100;
    
    if (chances.size() > maxPercent) {
        maxPercent = chances.size();
    }
    
    int chance = CCRANDOM_0_1() * maxPercent;
    
    if ((chance < 0) && (chance >= chances.size())) {
        return false;
    }
    
    bool isHide = false;
    if (curCountCleared == 4) {
        isHide = true;
    }
    
    if (curCountCleared == 5) {
        if ( ((int)CCRANDOM_0_1() * 2) == 1 ) {
            isHide = true;
        }
    }
    
    Bonus * chanceBonus = findByType( chances[ chance ] );
    if (chanceBonus) {
        if (chanceBonus->isAlwaysHide) {
            isHide = true;
        }
        // make bonus
        BonusItem * item = new BonusItem( chanceBonus, isHide, point );
        if (item) {
            item->CreateItem();
            if (isRare(chanceBonus->bonusType)) {
                itWasRare = true;
                if (Shop::isUpgradedTo("grenades", 5)) {
                    itWasRare = false;
                }
            }
            sound::getInstance()->playFirstSound("bubble_create");
        }
        
    }
    
    return true;
}

void Bonus::startMegaBonus()
{
    for (int i=0; i < Bonus::startBubbles.size(); i++) {
        CCPoint pnt;
        pnt.x = Bonus::startBubbles[i].x + int(CCRANDOM_MINUS1_1() * 5);
        pnt.y = Bonus::startBubbles[i].y + int(CCRANDOM_MINUS1_1() * 20);
        Bonus::calcBonuses( 7, pnt , 7, true );
    }
}
    
//------
Bonus * Bonus::findByType( int type ){
    vector<Bonus *>::iterator it = Bonus::bonuses.begin();
    
    for (; it != bonuses.end(); it++ ) {
        if (*it) {
            if( (*it)->bonusType == type ){
                return *it;
            }
        }
    }
    return NULL;
}
//------
int Bonus::GetPercent(map<int, int> percents, int value){

    int percent = 0;
    map<int, int>::iterator it = percents.begin();

    for (; it!=percents.end(); it++) {
        if (it->first >= value) {
            percent = it->second;
			return percent;
        }
        
    }
    return percent;
}
//------
float Bonus::GetPercent(map<int, float> percents, int value){
    float percent = 0;
    map<int, float>::iterator it = percents.begin();
    for (; it!=percents.end(); it++) {
        if (it->first >= value) {
            percent = it->second;
			return percent;
        }
    }
    return percent;
}

//------
void Bonus::updateBonuses( float delta ){
    vector<Bonus*>::iterator it = Bonus::bonuses.begin();
    for (; it!=Bonus::bonuses.end(); it++) {
        Bonus * bonus = *it;
        if (bonus) {
            if (bonus->timeToCooldownOff > 0) {
                bonus->timeToCooldownOff -= delta;
            }else {
                bonus->timeToCooldownOff = 0;
            }
        }
    }
   
    BonusItem::updateBonusItems(delta);
    
}
//------
void Bonus::makeCooldown(){
    timeToCooldownOff = coolDownTime;
}




BonusItem::BonusItem(Bonus * bonus, bool _isHide, CCPoint _startPoint){
    parentBonus     = bonus;
    if (bonus) {
        bonusType   = bonus->bonusType;
        bonus->makeCooldown();
    }
    
    isHide          = _isHide;
    startPoint      = _startPoint;
    state           = BIS_CREATING;
	needToDestroy	= false;
    userData        = NULL;

    bubbleSpeed     = Bonus::GetPercent(Bonus::bubbleSpeedByLevel, LevelLoader::getInstance()->curStageNumber);
    
    BonusItem::bonusItems.push_back( this );
    
}

BonusItem::~BonusItem(){

	if( GameScene::gameScene )
		if( GameScene::gameScene->loader ){
			if( bubbleSprite ){
				///GameScene::gameScene->loader->removeSprite( bubbleSprite );
                if (bubblesSprite) {
                    bubbleSprite->removeChild(bubblesSprite, false);
                    bubblesSprite->removeSelf();
                    bubblesSprite = NULL;
                }
                
                bubbleSprite->removeSelf();
				bubbleSprite = NULL;
			}
			if(  bonusSprite ){
				//GameScene::gameScene->loader->removeSprite( bonusSprite );
                bonusSprite->removeSelf();
				bonusSprite = NULL;
			}	
		}
}

int BonusItem::countType( int type ){
	int count = 0;
	vector<BonusItem *>::iterator it = BonusItem::bonusItems.begin();
	for(; it != BonusItem::bonusItems.end(); it++ ){
		BonusItem * item = *it;
		if( item ){
			if(item->bonusType == type)
				count++;
		}
	}
	return count;
}

void BonusItem::destroyAllItems(){
	vector<BonusItem *>::iterator it = BonusItem::bonusItems.begin();
	for(; it != BonusItem::bonusItems.end(); it++ ){
		BonusItem * item = *it;
		if( item ){
			delete item;
			*it = NULL;
		}
	}
	bonusItems.clear();
	
}

void BonusItem::destroyItems(){
	vector<BonusItem *>::iterator it = BonusItem::bonusItems.begin();
	for(; it != BonusItem::bonusItems.end(); it++ ){
		BonusItem * item = *it;
		if( item->needToDestroy ){
			delete item;
			*it = NULL;
            BonusItem::bonusItems.erase(it);
			BonusItem::destroyItems();
            return ;
		}
	}
	
}


void BonusItem::loadBubbleRect(){

    GameScene::gameScene->afterNewStage();
    
	LevelHelperLoader *loader = Game::getLoader();
	
    LHSprite * lbBubbleSprite   = loader->spriteWithUniqueName("bubbleLeftBottom");
	LHSprite * rtBubbleSprite   = loader->spriteWithUniqueName("bubbleRightTop");
    
	if( loader ){
		if( lbBubbleSprite && rtBubbleSprite ){
            BonusItem::bubbleRect.origin.x = min( lbBubbleSprite->getPosition().x, rtBubbleSprite->getPosition().x );
            BonusItem::bubbleRect.origin.y = min( lbBubbleSprite->getPosition().y, rtBubbleSprite->getPosition().y );
            //BonusItem::
            
            BonusItem::bubbleRect.size.width	=	max( lbBubbleSprite->getPosition().x, rtBubbleSprite->getPosition().x ) -
            min( lbBubbleSprite->getPosition().x, rtBubbleSprite->getPosition().x );
            
            BonusItem::bubbleRect.size.height	=	max( lbBubbleSprite->getPosition().y, rtBubbleSprite->getPosition().y ) - 
            min( lbBubbleSprite->getPosition().y, rtBubbleSprite->getPosition().y );
        }
        
	}
    /// calc fly length of bubble
    BonusItem::bubbleFlyLength = BonusItem::bubbleEndPoint.y - BonusItem::bubbleRect.origin.y;
	
}

//----
void BonusItem::updateBonusItems( float delta ){
	///first, destroy items
	BonusItem::destroyItems();

     vector<BonusItem*>::iterator itemIt = BonusItem::bonusItems.begin();
     for (; itemIt != BonusItem::bonusItems.end() ; itemIt++ ) {
     BonusItem * item = *itemIt;
         if (item) {
             if (item->state == BIS_FLYING) {
                 if (item->bonusSprite && item->bubbleSprite) {
                     item->bonusSprite->setPosition(item->bubbleSprite->getPosition());
                 }
             }
         }
     }
     
    
}

void BonusItem::CreateItem(){
    
    state = BIS_FLYING;
    
    int curLevel = LevelLoader::getInstance()->curStageNumber;
    
    int x = startPoint.x, y = startPoint.y;
    
    if (x < BonusItem::bubbleRect.origin.x ) {        x = BonusItem::bubbleRect.origin.x;    }
    if (y < BonusItem::bubbleRect.origin.y ) {        y = BonusItem::bubbleRect.origin.y;    }    
    if (x > BonusItem::bubbleRect.origin.x + BonusItem::bubbleRect.size.width  )
        {  x = BonusItem::bubbleRect.origin.x + BonusItem::bubbleRect.size.width;    }
    if (y > BonusItem::bubbleRect.origin.y + BonusItem::bubbleRect.size.height  )
        {  y = BonusItem::bubbleRect.origin.y + BonusItem::bubbleRect.size.height;    }
    
    CCPoint point = ccp(x,y);
    
  	LevelHelperLoader *loader = Game::getLoader();
    if (!loader) {
        TESTLOG("BonusItem::CreateItem no loader");
        return;
    }
    //bonusSprite = loader->createBatchSpriteWithUniqueName("question");
    LHLayer * mLayer = loader->layerWithUniqueName("MAIN_LAYER");
    LHBatch * batch = mLayer->batchWithUniqueName("items");

    //if (bonusSprite) {
    //    if (!isHide) {
            switch (bonusType) {
                case BT_COIN:
                {
                    bonusSprite = LHSprite::spriteWithName("coin", "items", "sprites.pshs");
                    break;
                }
                case BT_GRENADE:
                {
                    bonusSprite = LHSprite::spriteWithName("grenade0001", "items", "sprites.pshs");
                    if (!bonusSprite) {
                        break;
                    }
                    bonusSprite->prepareAnimationNamed("grenade", "sprites.pshs" );
                    /// generate random figure for color
                    Figure * figure = LevelLoader::getInstance()->getCurStage()->randomFigure();
                    if (Shop::isUpgradedTo("grenades", 4)) {
                        ///calc color index
                        int colorFigure = AliensManager::getInstance()->maxColorOfAliens();
                        figure = LevelLoader::getInstance()->getCurStage()->getFigureByColor(colorFigure-1);
                        //figure->color_index = colorFigure;
                    }
                    
                    // set frame with needed color
                    if( (figure->color_index > 0) && (figure->color_index <= bonusSprite->numberOfFrames()) ){
                        bonusSprite->setFrame(figure->color_index - 1);
                    }
                    
                    userData = (void *)figure;
                }   
                    break;
                case BT_POINTS1:
                {
                    bonusSprite = LHSprite::spriteWithName("gift0001", "items", "sprites.pshs");
                    break;
                }
                case BT_POINTS2:
                {
                    bonusSprite = LHSprite::spriteWithName("gift0002", "items", "sprites.pshs");
                    break;
                }
                case BT_POINTS3:
                {
                    bonusSprite = LHSprite::spriteWithName("gift0003", "items", "sprites.pshs");
                    break;
                }
                case BT_MEGABOMB:
                {
                    bonusSprite = LHSprite::spriteWithName("bonuses0006", "items", "sprites.pshs");
                    break;
                }
                case BT_ROCKET:
                {
                    bonusSprite = LHSprite::spriteWithName("fall", "items", "sprites.pshs");
                    break;
                }
                case BT_TOUCH_TO_KILL:
                {
                    bonusSprite = LHSprite::spriteWithName("bonuses0004", "items", "sprites.pshs");
                    break;
                }
                case BT_GUN:
                {
                    bonusSprite = LHSprite::spriteWithName("bonuses0008", "items", "sprites.pshs");
                    break;
                }
                    
                default:
                    break;
            }
    
    //    }
    //}


    
    bubbleSprite = LHSprite::spriteWithName("bubble0001", "items", "sprites.pshs");
    bubblesSprite = LHSprite::spriteWithName("bubble0002", "items", "sprites.pshs");
    
    if (bonusSprite && bubbleSprite && batch && bubblesSprite) {
        batch->addChild( bonusSprite );
        batch->addChild( bubbleSprite, 1 );
        bubbleSprite->setPosition(point);
        bubbleSprite->addChild(bubblesSprite);
        
        

        bubblesSprite->setAnchorPoint(ccp(0.5,0.8));

        bubblesSprite->setPosition(ccp(bubbleSprite->boundingBox().size.width/2,0));
        bubblesSprite->prepareAnimationNamed("bubbles_fly", "sprites.pshs" );
        bubblesSprite->playAnimation();
        
        
        /*
        CCNode * parentNode = bubbleSprite->getParent();
        if (parentNode) {
            parentNode->reorderChild(bubbleSprite, bubbleSprite->getZOrder()+1);
        }*/
        bubbleSprite->runAction( Effect::Bubble(1, 0.1, true));
        //bubbleSprite->
        
        bonusSprite->setPosition(point);
        bonusSprite->runAction(Effect::PulseSmall(1, 0.1, true ));

        
        float timeToFly = Bonus::GetPercent(Bonus::bubbleSpeedByLevel, curLevel);
        
        if (Shop::isUpgradedTo("bonuses", 5)) {
            timeToFly = timeToFly * 1.3;
        }
        
        CCMoveBy *      moveFly         = CCMoveBy::create(timeToFly,
                                                           ccp(0,BonusItem::bubbleFlyLength)                                                                       );
        
        
        CCCallFuncN *   funcAction      = CCCallFuncN::create(this, callfuncN_selector(BonusItem::endOfFly));
        
        bubbleSprite->runAction(CCSequence::create(moveFly,funcAction,NULL));

        PlayEvents::getInstance()->onCreateBubble(this);

        TESTLOG("BonusItem::CreateItem() create item %s", bonusSprite->getUniqueName().c_str());

    }
}

void BonusItem::endOfFly(CCNode * node){
    if (state == BIS_FLYING) {
        TESTLOG("BonusItem::endOfFly destroy item %s", bonusSprite->getUniqueName().c_str());
        state = BIS_DELETENG;
		destroyYorself();
        //BonusItem::destroyItem(this);
        return;
    }
    if (state == BIS_USING) {
        TESTLOG("BonusItem::endOfFly destroy item %s", bonusSprite->getUniqueName().c_str());
        state = BIS_DELETENG;
		destroyYorself();
       // BonusItem::destroyItem(this);
        return;
    }
    
}

void BonusItem::destroyYorself(){
	needToDestroy = true;
}

void BonusItem::useBonus(CCPoint touchPoint){
    
    PlayEvents::getInstance()->onTouchBubble(this);
    
    sound::getInstance()->playFirstSound("bubble_bang");
    
    if (state == BIS_FLYING) {
        TESTLOG("BonusItem::useBonus destroy item %s", bonusSprite->getUniqueName().c_str());
        state = BIS_USING;
        /// make using of bonus
        if (bonusSprite) {
            int curLevel = LevelLoader::getInstance()->curStageNumber;            
            
            switch (bonusType) {
                case BT_COIN:
                    ////bonusSprite->prepareAnimationNamed("coinPickUp", "items.pshs" );
                    bonusSprite->playAnimation();
                    if (GameScene::gameScene) {
                        GameScene::gameScene->coinsGetIt(touchPoint, 0 );
                    }
                    break;
                case BT_GRENADE:
                    //bonusSprite->prepareAnimationNamed("grenadePickUp", "items.pshs" );
                    //bonusSprite->playAnimation();
                    
                    if (userData != NULL) {
                        Figure * figure = (Figure *)userData;
						AliensManager::getInstance()->setClearByColor( figure->tag );

                    }
                    break;
                case BT_POINTS1:
                    //bonusSprite->prepareAnimationNamed("giftPoints1", "items.pshs" );
                    //bonusSprite->playAnimation();
                    if (GameScene::gameScene) {
                        PlayEvents::getInstance()->onGetPointBonus(curLevel * 100, 1);
                        GameScene::gameScene->scoreHitAtPosition(touchPoint, curLevel * 100 );
                    }
                    break;
                case BT_POINTS2:
                    //bonusSprite->prepareAnimationNamed("giftPoints2", "items.pshs" );
                    //bonusSprite->playAnimation();
                    
                    if (GameScene::gameScene) {
                        PlayEvents::getInstance()->onGetPointBonus(curLevel * 100, 2);
                        GameScene::gameScene->scoreHitAtPosition(touchPoint, curLevel * 1000 );
                    }
                    break;
                case BT_POINTS3:
                    //bonusSprite->prepareAnimationNamed("giftPoints3", "items.pshs" );
                    //bonusSprite->playAnimation();
                    if (GameScene::gameScene) {
                        PlayEvents::getInstance()->onGetPointBonus(curLevel * 100, 3);
                        GameScene::gameScene->scoreHitAtPosition(touchPoint, curLevel * 10000 );
                    }
                    break;
                case BT_MEGABOMB:
                    //bonusSprite->prepareAnimationNamed("cosmoBomb", "items.pshs" );
                    //bonusSprite->playAnimation();
                    CosmoBonuses::getInstance()->addBonus(BT_MEGABOMB, 1, touchPoint, true);
                    PlayEvents::getInstance()->onPickUpCosmoBombBonus();
                    break;
                case BT_ROCKET:
                    //bonusSprite->prepareAnimationNamed("rocketFly", "items.pshs" );
                    //bonusSprite->playAnimation();

                    GameScene::gameScene->fallRandomFigures();
                    break;
                case BT_TOUCH_TO_KILL:
                    CosmoBonuses::getInstance()->addBonus(BT_TOUCH_TO_KILL, 1, touchPoint, true);
                    PlayEvents::getInstance()->onPickUpTouchToKillBonus();
                    break;
                    
                case BT_GUN:
                    CosmoBonuses::getInstance()->addBonus(BT_GUN, 1, touchPoint, true);
                    PlayEvents::getInstance()->onPickUpGunBonus();
                    break;
                    
                default:
                    break;
            }

            CCCallFuncN *   funcAction      = CCCallFuncN::create(this, callfuncN_selector(BonusItem::endOfFly));

            bonusSprite->runAction(Effect::Fade(0.5,0));
            bonusSprite->runAction(CCSequence::create( (CCActionInterval *)Effect::Zoom(0.6,4), funcAction, NULL ));
            
            
        }

        if( bubbleSprite ){
            bubbleSprite->stopAllActions();
            
            bubbleSprite->prepareAnimationNamed("bubble_bang", "sprites.pshs");
            bubbleSprite->playAnimation();
            
            
            bubbleSprite->runAction(Effect::Fade(0.6, 0));
            bubbleSprite->runAction(Effect::Zoom(0.6, 3));
            
            bubblesSprite->setVisible(false);
        }
        
        /// temp 
        //BonusItem::destroyItem(this);
        return;
        ///temp
        
    }
}

BonusItem * BonusItem::checkTouch(CCPoint touchPoint ){
    vector<BonusItem*>::iterator itemIt = BonusItem::bonusItems.begin();
    for (; itemIt != BonusItem::bonusItems.end() ; itemIt++ ) {
        BonusItem * item = *itemIt;
        if (item) {
            if (item->state == BIS_FLYING) {
                if (item->bonusSprite && item->bubbleSprite) {
                    if (item->bubbleSprite->boundingBox().containsPoint(touchPoint)) {
                        return item;
                    }
                }
            }
        }
    }    
    return NULL;
}




