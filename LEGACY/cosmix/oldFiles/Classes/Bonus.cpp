//
//  Bonus.cpp
//  boltrix
//
//  Created by Den on 12.08.12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#include "Bonus.h"
#include "Effect.h"
#include "FigureUnit.h"
#include "LevelLoader.h"
//static 
vector<Bonus *>     Bonus::bonuses;
map<int, int>       Bonus::percentActionByFigureCleared;
map<int,float>      Bonus::bubbleSpeedByLevel;   
map<int,int>        Bonus::maxItemsByLevel;
bool				Bonus::isInitialized = false;

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
//------
bool Bonus::calcBonuses( int countCleared, CCPoint point , int comboCount ){

    int curCountCleared = countCleared;
    
    if (countCleared < 4) {
        return false;
    }
    
    curCountCleared = curCountCleared + comboCount;
    
    int curLevel = LevelLoader::getInstance()->curStageNumber;
    
    int maxItems = Bonus::GetPercent( Bonus::maxItemsByLevel, curLevel );
    if (BonusItem::bonusItems.size() >= maxItems ) {
        return false;
    }
    
    int curPercent = Bonus::GetPercent(percentActionByFigureCleared, curCountCleared );
    
    //curPercent = curPercent ;
    
    if( (CCRANDOM_0_1() * 100) > curPercent )
        return false;
    
    vector<int> chances;
    
    
    vector< Bonus* >::iterator it = bonuses.begin();
    for (; it != bonuses.end(); it++) {
        Bonus * curBonus = *it;
        int percent = 0;
        if (curBonus) {
            if (curBonus->timeToCooldownOff <= 0) {
                if (curBonus->percentByLevel.size() > 0) {
                    percent = Bonus::GetPercent( curBonus->percentByLevel, curLevel);
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
        }
        
    }
    
    return true;
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
    
	LevelHelperLoader *loader = GameScene::gameScene->loader;
	
    LHSprite * lbBubbleSprite   = GameScene::gameScene->loader->spriteWithUniqueName("bubbleLeftBottom");
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
    
  	LevelHelperLoader *loader = GameScene::gameScene->loader;
    if (!loader) {
        CCLOG("BonusItem::CreateItem no loader");
        return;
    }
    bonusSprite = loader->createBatchSpriteWithUniqueName("question");

    if (bonusSprite) {
        if (!isHide) {
            switch (bonusType) {
                case BT_COIN:
                    //bonusSprite->startAnimationNamed("coin");
                    bonusSprite->prepareAnimationNamed("coin", "items.pshs" );
                    bonusSprite->playAnimation();
                    break;
                case BT_GRENADE:
                {
                    //bonusSprite->startAnimationNamed("grenade");
                    bonusSprite->prepareAnimationNamed("grenade", "items.pshs" );
                    bonusSprite->playAnimation();
                    
                    /// generate random figure for color
                    Figure * figure = LevelLoader::getInstance()->getCurStage()->randomFigure();
                    
                    //if (CFigureUnit::getCountByTag(figure->tag) < 4) {
                       //figure = CFigureUnit::getMaxFiguresOnLevel();
                    //}
                    
                    userData = (void *)figure;
                    
                    bonusSprite->setColor(figure->color);
                }   
                    break;
                case BT_POINTS1:
                    bonusSprite->prepareAnimationNamed("giftPoints1", "items.pshs" );
                    bonusSprite->playAnimation();
                    
                    break;
                case BT_POINTS2:
                    bonusSprite->prepareAnimationNamed("giftPoints2", "items.pshs" );
                    bonusSprite->playAnimation();
                    
                    break;
                case BT_POINTS3:
                    bonusSprite->prepareAnimationNamed("giftPoints3", "items.pshs" );
                    bonusSprite->playAnimation();
                    break;
                case BT_MEGABOMB:
                    bonusSprite->prepareAnimationNamed("cosmoBomb", "items.pshs" );
                    bonusSprite->playAnimation();
                    break;
                case BT_ROCKET:
                    bonusSprite->prepareAnimationNamed("rocket", "items.pshs" );
                    bonusSprite->playAnimation();
                    
                    break;
                default:
                    break;
            }
            
        }
    }
    
    bubbleSprite = loader->createBatchSpriteWithUniqueName("bubble");
    
    if (bonusSprite && bubbleSprite) {
        bubbleSprite->setPosition(point);
        CCNode * parentNode = bubbleSprite->getParent();
        if (parentNode) {
            parentNode->reorderChild(bubbleSprite, bubbleSprite->getZOrder()+1);
        }
        bubbleSprite->runAction( Effect::Bubble(1, 0.1, true));
        //bubbleSprite->
        
        bonusSprite->setPosition(point);
        bonusSprite->runAction(Effect::PulseSmall(1, 0.1, true ));

        float timeToFly = Bonus::GetPercent(Bonus::bubbleSpeedByLevel, curLevel);
        
        CCMoveBy *      moveFly         = CCMoveBy::create(timeToFly,                                                    ccp(0,BonusItem::bubbleFlyLength)                                                                       );
        
        
        CCCallFuncN *   funcAction      = CCCallFuncN::create(this, callfuncN_selector(BonusItem::endOfFly));
        
        bubbleSprite->runAction(CCSequence::create(moveFly,funcAction,NULL));

        CCLOG("BonusItem::CreateItem() create item %s", bonusSprite->getUniqueName().c_str());

    }
}

void BonusItem::endOfFly(CCNode * node){
    if (state == BIS_FLYING) {
        CCLOG("BonusItem::endOfFly destroy item %s", bonusSprite->getUniqueName().c_str());
        state = BIS_DELETENG;
		destroyYorself();
        //BonusItem::destroyItem(this);
        return;
    }
    if (state == BIS_USING) {
        CCLOG("BonusItem::endOfFly destroy item %s", bonusSprite->getUniqueName().c_str());
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
    if (state == BIS_FLYING) {
        CCLOG("BonusItem::useBonus destroy item %s", bonusSprite->getUniqueName().c_str());
        state = BIS_USING;
        /// make using of bonus
        if (bonusSprite) {
            int curLevel = LevelLoader::getInstance()->curStageNumber;            
            
            switch (bonusType) {
                case BT_COIN:
                    bonusSprite->prepareAnimationNamed("coinPickUp", "items.pshs" );
                    bonusSprite->playAnimation();
                    break;
                case BT_GRENADE:
                    bonusSprite->prepareAnimationNamed("grenadePickUp", "items.pshs" );
                    bonusSprite->playAnimation();
                    
                    if (userData != NULL) {
                        Figure * figure = (Figure *)userData;
                        CFigureUnit::setClearByColor( figure->tag );
                    }
                    break;
                case BT_POINTS1:
                    bonusSprite->prepareAnimationNamed("giftPoints1", "items.pshs" );
                    bonusSprite->playAnimation();
                    if (GameScene::gameScene) {
                        GameScene::gameScene->scoreHitAtPosition(touchPoint, curLevel * 100 );
                    }
                    break;
                case BT_POINTS2:
                    bonusSprite->prepareAnimationNamed("giftPoints2", "items.pshs" );
                    bonusSprite->playAnimation();
                    
                    if (GameScene::gameScene) {
                        GameScene::gameScene->scoreHitAtPosition(touchPoint, curLevel * 1000 );
                    }
                    break;
                case BT_POINTS3:
                    bonusSprite->prepareAnimationNamed("giftPoints3", "items.pshs" );
                    bonusSprite->playAnimation();
                    if (GameScene::gameScene) {
                        GameScene::gameScene->scoreHitAtPosition(touchPoint, curLevel * 10000 );
                    }
                    break;
                case BT_MEGABOMB:
                    bonusSprite->prepareAnimationNamed("cosmoBomb", "items.pshs" );
                    bonusSprite->playAnimation();
                    
                    break;
                case BT_ROCKET:
                    bonusSprite->prepareAnimationNamed("rocketFly", "items.pshs" );
                    bonusSprite->playAnimation();

                    GameScene::gameScene->fallRandomFigures();
                    break;
                default:
                    break;
            }

            CCCallFuncN *   funcAction      = CCCallFuncN::create(this, callfuncN_selector(BonusItem::endOfFly));

            bonusSprite->runAction(Effect::Fade(0.5,0));
            bonusSprite->runAction(CCSequence::create( (CCActionInterval *)Effect::Zoom(0.5,4), funcAction, NULL ));
            
            
        }

        if( bubbleSprite ){
            bubbleSprite->stopAllActions();
            
            bubbleSprite->prepareAnimationNamed("bubbleBang", "items.pshs");
            bubbleSprite->playAnimation();
            
            
            bubbleSprite->runAction(Effect::Fade(0.5, 0));
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




