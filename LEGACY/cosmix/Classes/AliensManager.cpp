#include "AliensManager.h"
#include "Game.h"
#include "Bonus.h"
#include "boom.h"
#include "PlayEvents.h"
#include "CosmoBonuses.h"
#include "Test.h"



AliensManager * AliensManager::instance = NULL;

//----------------------------------------
AliensManager::AliensManager(void)
{
}
//----------------------------------------
AliensManager::~AliensManager(void)
{
}
//----------------------------------------
AliensManager * AliensManager::getInstance()
{
	if( !AliensManager::instance ){
		AliensManager::instance = new AliensManager();
	}
	return AliensManager::instance;

}
//----------------------------------------
void AliensManager::destroyInstance()
{
	if( AliensManager::instance ){
		delete AliensManager::instance;
		AliensManager::instance = NULL;
	}
}
//----------------------------------------
Alien * AliensManager::createAlien	(Alien * _childAlien)
{
	if( !_childAlien  )
		return NULL;

	Alien * alien = createAlien( _childAlien->figure );
    
    if( alien->getSprite() ){
        alien->getSprite()->transformPosition(_childAlien->getSprite()->getPosition());
        alien->getSprite()->transformRotation(_childAlien->getSprite()->getRotation());
        alien->getSprite()->transformScaleX(_childAlien->getSprite()->getScaleX());
        alien->getSprite()->transformScaleX(_childAlien->getSprite()->getScaleY());
		alien->getSprite()->setTag(_childAlien->getSprite()->getTag());
        
    }

	return alien;
}
//----------------------------------------
Alien * AliensManager::createAlien			(Figure * _figure)
{
	Alien * alien = new Alien(Game::getLoader(), _figure, false);
	aliensBySprites.insert(make_pair(alien->getSprite(), alien));
	return alien;
}
//----------------------------------------
Alien * AliensManager::createShadowAlien			(Figure * _figure)
{
	Alien * alien = new Alien(Game::getLoader(), _figure, false, CREATE_TYPE_SHADOW);
	aliensBySprites.insert(make_pair(alien->getSprite(), alien));
	return alien;
}

//----------------------------------------
Alien * AliensManager::createShadowAlien	(Alien * _childAlien)
{
	if( !_childAlien  )
		return NULL;
    
	Alien * alien = createShadowAlien( _childAlien->figure );
    
    if( alien->getSprite() ){
        alien->getSprite()->transformPosition(_childAlien->getSprite()->getPosition());
        alien->getSprite()->transformRotation(_childAlien->getSprite()->getRotation());
        alien->getSprite()->transformScaleX(_childAlien->getSprite()->getScaleX());
        alien->getSprite()->transformScaleX(_childAlien->getSprite()->getScaleY());
		//alien->getSprite()->setTag(_childAlien->getSprite()->getTag());
    }
    
	return alien;
}


//----------------------------------------
Alien * AliensManager::createPhysicsAlien	(Alien * _childAlien, bool addToPool)
{
	if( !_childAlien  )
		return NULL;
    
	Alien * alien = createPhysicsAlien( _childAlien->figure, addToPool );
    
    if( alien->getSprite() ){
        alien->getSprite()->transformPosition(_childAlien->getSprite()->getPosition());
        alien->getSprite()->transformRotation(_childAlien->getSprite()->getRotation());
        alien->getSprite()->transformScaleX(_childAlien->getSprite()->getScaleX());
        alien->getSprite()->transformScaleX(_childAlien->getSprite()->getScaleY());
        alien->getSprite()->setTag(_childAlien->getSprite()->getTag());
    }
    
	return alien;

}
//----------------------------------------
Alien * AliensManager::createPhysicsAlien	(Figure * _figure, bool addToPool)
{
	Alien * alien = new Alien(Game::getLoader(), _figure, true);
	if( alien ){
		aliensBySprites.insert(make_pair(alien->getSprite(), alien));
        if(addToPool){
            physicsAliens.insert(make_pair(alien, alien->figure->tag));
        }else{
            alien->getSprite()->setTag(0);
        }
	}
    return alien;
}
//----------------------------------------
// Добавляет в пул физических объектов для расчета столкновений
void AliensManager::addToPool(Alien * alien)
{
    if (alien) {
        alien->getSprite()->setTag(alien->figure->tag);
        physicsAliens.insert(make_pair(alien, alien->figure->tag));
        
    }
}

//----------------------------------------
// есть ли в пуле
bool AliensManager::isInPool(Alien * alien)
{
    if (alien) {
        if(physicsAliens.find(alien) != physicsAliens.end())
            return true;
    }
    return false;
}


//----------------------------------------
Alien * AliensManager::createNextAlien			(Figure * _figure)
{
	Alien * alien = new Alien(Game::getLoader(), _figure, false,CREATE_TYPE_NEXTFIGURE);
	aliensBySprites.insert(make_pair(alien->getSprite(), alien));
	return alien;
}

//----------------------------------------
void AliensManager::removeAlien( Alien * alien )
{
    if (!alien) {
        return;
    }
    
    if (alien->getSprite()) {
        if (aliensBySprites.find(alien->getSprite()) != aliensBySprites.end()) {
            aliensBySprites.erase(alien->getSprite());
        }
    }
    
    if (alien->isPhysics) {
        if(physicsAliens.find(alien) != physicsAliens.end()){
            physicsAliens.erase(alien);
        }
    }
    
    delete alien;
    alien = NULL;
}
//----------------------------------------
void AliensManager::removeAlienBySprite( LHSprite * _sprite )
{
    removeAlien( alienBySprite(_sprite) );
}
//----------------------------------------
Alien * AliensManager::alienBySprite( LHSprite * _sprite )
{
    map<LHSprite *, Alien *>::iterator It = aliensBySprites.find(_sprite);
    if (It != aliensBySprites.end()) {
        return It->second;
    }
    return NULL;
}
//----------------------------------------
void AliensManager::updatePositions()
{
    map<Alien *,int>::iterator it = physicsAliens.begin();
    for (; it != physicsAliens.end(); it++) {
        ((Alien*)it->first)->updatePosition();
    }
    
}

//----------------------------------------
void AliensManager::collide( LHSprite * spriteA, LHSprite * spriteB )
{
	if( spriteA != NULL && spriteB != NULL){
		Alien * alienA = alienBySprite(spriteA);
		Alien * alienB = alienBySprite(spriteB);
		if ( alienA!=NULL && alienB!=NULL ){
			alienA->collide( alienB );
			alienB->collide( alienA );
            calculate();
		}
	}
}
//----------------------------------------
void AliensManager::uncollide( LHSprite * spriteA, LHSprite * spriteB )
{
	if( spriteA != NULL && spriteB != NULL){
		Alien * alienA = alienBySprite(spriteA);
		Alien * alienB = alienBySprite(spriteB);
		if ( alienA!=NULL && alienB!=NULL ){
			alienA->uncollide( alienB );
			alienB->uncollide( alienA );
            calculate();
		}
	}
}
//----------------------------------------
void AliensManager::preCalculate()
{
    map<Alien *, int>::iterator it = physicsAliens.begin();
    for (; it!=physicsAliens.end(); it++) {
        
        if (it->first) {
            it->first->preCalcUnit();
        }else{
			TESTLOG("AliensManager::preCalculate WRONG UNIT");
		}
    }
    
}
//----------------------------------------
void AliensManager::calcGroup(Alien * alien, int groupId)
{
	if( !alien ){
		TESTLOG("AliensManager::calcGroup WRONG UNIT1");
		return;
	}
    
    map<Alien *,int> aliens;
    alien->calcCountCollided(groupId,&aliens);
    
    map<Alien *,int>::iterator it = aliens.begin();
    for (; it!=aliens.end(); it++) {
        Alien * alien2 = it->first;
		if(alien2){
			alien2->setCalcInfo(groupId, aliens.size());
		}else{
			TESTLOG("AliensManager::calcGroup WRONG UNIT2");
		}
    }
    
    aliens.clear();
    //TESTLOG( "GROUP %d has %d figures!", groupId, sprites.size() );
}
//----------------------------------------
void AliensManager::calculate()
{
    preCalculate(); /// init calculation
    int groupIndex = 0;
    map<Alien *, int>::iterator it = physicsAliens.begin();
    for (; it!=physicsAliens.end(); it++) {
        Alien * alien = it->first;
        if (alien!=NULL) {
            if (!alien->isCalculated) {
                calcGroup(alien, groupIndex++);
            }
        }else{
			TESTLOG(" AliensManager::calculate WRONG UNIT");
		}
    }
}
//----------------------------------------
//----------------------------------------
void AliensManager::updateTime( float tick )
{
    map<Alien *, int>::iterator it = physicsAliens.begin();
    for (; it!=physicsAliens.end(); it++) {
        Alien * alien = it->first;
        if (alien!=NULL) {
            if (alien->isClearingSoon) {
                alien->timeToClear-=tick;
                if (alien->timeToClear < 0 && !alien->isNeedToClear) {
                    alien->isNeedToClear = true;
                    setClearByGroup(alien->group);
                }
            }
			alien->updateBlink( tick );
			alien->updateFallingBonus( tick );
        }else{
			TESTLOG("CFigureUnit::updateTime WRONG UNIT");
		}
    }
    
    removeCollidedSprite();
    
    
}
//----------------------------------------
vector<Alien *> AliensManager::aliensByGroup(int groupId)
{
    vector<Alien *> aliens;
    map<Alien *, int>::iterator it = physicsAliens.begin();
    for (; it!=physicsAliens.end(); it++) {
        Alien * alien = it->first;
        if (alien!=NULL) {
            if (alien->group == groupId) {
                aliens.push_back(alien);
            }
        }else{
			TESTLOG("CFigureUnit::spritesByGroup WRONG UNIT");
		}
    }
    return aliens;
}
//----------------------------------------
//// сокращение группы!!!!
void AliensManager::setClearByGroup(int groupId)
{
    float minX = 99999.9, maxX = -9999.0;
    float minY = 99999.9, maxY = -9999.0;
    CCPoint pos;
    int clearCount = 0;
    map<Alien *, int>::iterator it = physicsAliens.begin();
    for (; it!=physicsAliens.end(); it++) {
        Alien * alien = it->first;
        if (alien!=NULL) {
            if (alien->group == groupId) {
                alien->isNeedToClear = true;
                alien->isNeedToDelete = true;
                //unit->collidedSprites.clear();
                pos = alien->getSprite()->getPosition();
                if( minX > pos.x ){
                    minX = pos.x;
                }
                if( minY > pos.y ){
                    minY = pos.y;
                }
                if( maxX < pos.x ){
                    maxX = pos.x;
                }
                if( maxY < pos.y ){
                    maxY = pos.y;
                }
                
				clearCount++;
            }
        }else{
			TESTLOG("CFigureUnit::setClearByGroup WRONG UNIT");
		}
    }
    /// орпеделение центральной позиции группы
    pos.x = minX + ((maxX - minX)/2);
    pos.y = minY + ((maxY - minY)/2);
    int comboCnt = 0;
    if (clearCount >=4) {
        /// вызвать сокращение группы и определение комбо!!!
        comboCnt = GameScene::gameScene->checkCombo(pos);
    	Bonus::calcBonuses( clearCount, pos, comboCnt );
    }
    
    PlayEvents::getInstance()->onClearFigures(clearCount);
}
//----------------------------------------
int AliensManager::getCountByTag(int tag)
{
    int count = 0;
    map<Alien *, int>::iterator it = physicsAliens.begin();
    for (; it!=physicsAliens.end(); it++) {
        Alien * alien = it->first;
        if (alien!=NULL) {
            if (alien->figure->tag == tag) {
                count++;
            }
            
        }
    }
    return count;
}
//----------------------------------------
Figure * AliensManager::getMaxFiguresOnLevel()
{
    Figure * maxFigure = NULL;
    map<Figure *, int> figuresCount;
    map<Figure *, int>::iterator It;
    map<Alien *, int>::iterator it = physicsAliens.begin();
    for (; it!=physicsAliens.end(); it++) {
        Alien * alien = it->first;
        if (alien!=NULL) {
            
            It = figuresCount.find(alien->figure);
            if (It == figuresCount.end()) {
                figuresCount.insert(make_pair(alien->figure, 1));
            }else {
                It->second++;
            }
        }
    }
    int MaxCount = 0;
    if (figuresCount.size() > 0) {
        for (It = figuresCount.begin(); It != figuresCount.end(); It++) {
            if ((!maxFigure) || (MaxCount < It->second) ) {
                maxFigure = It->first;
                MaxCount = It->second;
            }
        }
    }
    figuresCount.clear();
    
    return maxFigure;
}
//----------------------------------------
//// сокращение группы!!!!
void AliensManager::setClearByColor(int tag, int count){
    float minX = 99999.9, maxX = -9999.0;
    float minY = 99999.9, maxY = -9999.0;
    CCPoint pos;
    int clearCount = 0;
    map<Alien *, int>::iterator it = physicsAliens.begin();
    for (; it!=physicsAliens.end(); it++) {
        Alien * alien = it->first;
        if (alien!=NULL) {
            
            if (alien->figure->tag == tag ) {
                
                alien->isNeedToClear = true;
                alien->isNeedToDelete = true;
                
                pos = alien->getSprite()->getPosition();
                if( minX > pos.x ){
                    minX = pos.x;
                }
                if( minY > pos.y ){
                    minY = pos.y;
                }
                if( maxX < pos.x ){
                    maxX = pos.x;
                }
                if( maxY < pos.y ){
                    maxY = pos.y;
                }
                
                clearCount++;
            }
        }else{
			TESTLOG("CFigureUnit::setClearByColor WRONG UNIT");
		}
    }
    /// орпеделение центральной позиции группы
    pos.x = minX + ((maxX - minX)/2);
    pos.y = minY + ((maxY - minY)/2);
    /// вызвать сокращение группы и определение комбо!!!
    
    PlayEvents::getInstance()->onUseGrenade(tag,clearCount);
    
    if (clearCount >=4) {
        int comboCnt = GameScene::gameScene->checkCombo(pos);
    	Bonus::calcBonuses( clearCount, pos, comboCnt );
    }
	
}





//----------------------------------------
void AliensManager::removeCollidedSprite()
{

    map<Alien *, int>::iterator it = physicsAliens.begin();
    for (; it!=physicsAliens.end(); it++) {
        Alien * alien = it->first;
        LHSprite * sprite = alien->getSprite();
        if (sprite!=NULL) {
            if (alien!=NULL) {
                //string name = (*it)->getUniqueName();
                if (alien->isNeedToDelete) {
                    
                    
                    //alien->collidedSprites.clear();
                    //*it = NULL;
                    //allSprites.erase(it);
                    
                    
                    /*LHLayer * mLayer = Game::getLoader()->layerWithUniqueName("MAIN_LAYER");
                    LHBatch * batch = mLayer->batchWithUniqueName("types");

					// create BANG sprite animation
                    //LHSprite * dieSprite = Game::getLoader()->createBatchSpriteWithUniqueName(alien->figure->getExplosionSprite());
                    LHSprite * dieSprite = LHSprite::batchSpriteWithName(alien->figure->getExplosionSprite(), batch);
                    //LHSprite * dieSprite = LHSprite::spriteWithName(alien->figure->getExplosionSprite(), "types","types.pshs");
                    
                    batch->addChild( dieSprite );
                    
                    dieSprite->setPosition(sprite->getPosition());
                    dieSprite->setRotation(sprite->getRotation());
                    dieSprite->setScaleX(sprite->getScaleX());
                    dieSprite->setScaleY(sprite->getScaleY());
                    dieSprite->setTag(DELETING_SPRITE);
                    dieSprite->prepareAnimationNamed("bang", "types.pshs" );
                    dieSprite->playAnimation();
                    
                    TESTLOG("Bang sprite = %s", dieSprite->getUniqueName().c_str() );

                    //CCNotificationCenter::sharedNotificationCenter()->addObserver((CCObject*)GameScene::gameScene, callfuncO_selector(GameScene::spriteAnimHasEnded), LHAnimationHasEndedNotification, dieSprite);//
                    

                    
					CCScaleTo * scaleAction	= CCScaleTo::create( 1, 2, 2 );
					CCMoveBy * moveAction	= CCMoveBy::create( 1, ccp(0, 100) );
					dieSprite->runAction(scaleAction);
					dieSprite->runAction(moveAction);
                    */
                    
                    //CBoomSprite * boom =
                    new CBoomSprite(alien);
                    
                    PlayEvents::getInstance()->onClearFigure(alien);
					
					GameScene::gameScene->scoreHitAtPosition( sprite->getPosition(), alien->countCollided, CCRANDOM_0_1() * 0.5, alien->figure->color_index );
                    LevelLoader::getInstance()->addCleared(1);
                    if( GameScene::gameScene->fallingAlien){
						if( GameScene::gameScene->fallingAlien->getSprite() == sprite ){
							GameScene::gameScene->fallingAlien = NULL;
						}
					}
                    
                    alien->uncollideAll();
                    AliensManager::getInstance()->removeAlien(alien);
                    
         			if( physicsAliens.size() > 0 ){
						it = physicsAliens.begin();
					}else{
						TESTLOG("CFigureUnit::removeCollidedSprite WRONG allSprites.size()");
						break;
					}
                }
            }
        }
    }
}

void AliensManager::removeAllSprite(bool clear){
    
    TESTLOGFLIGHT("AliensManager::removeAllSprite(bool clear)");
    
    vector<Alien *> toRemove;
    
    map<Alien *, int>::iterator it = physicsAliens.begin();
    for (; it!=physicsAliens.end(); it++) {
        Alien * alien = it->first;
        if (alien) {
            toRemove.push_back(alien);
        }
    }

    for(vector<Alien*>::iterator it2 = toRemove.begin(); it2!=toRemove.end(); ++it2){
        Alien * alien = *it2;
        if (alien) {
            LHSprite * sprite = alien->getSprite();
            if (sprite!=NULL) {
                sprite->setTag(0);
                alien->uncollideAll();
                AliensManager::getInstance()->removeAlien(alien);
            }
        }
        *it2 = NULL;
    }
    toRemove.clear();
    physicsAliens.clear();
}

bool AliensManager::rectCollideWhithSprites(CCRect  rc){
    map<Alien *, int>::iterator it = physicsAliens.begin();
    for (; it!=physicsAliens.end(); it++) {
        Alien * alien = it->first;
        LHSprite * sprite = alien->getSprite();
        if (sprite!=NULL) {
			if( rc.intersectsRect(sprite->boundingBox()) ){
                if( rc.intersectsRect( GameScene::gameScene->boundBoxFromSprite(sprite))){
                    return true;
                }
				
			}
        }
    }
	return false;
}

int AliensManager::maxColorOfAliens()
{
    map<int,int> colors;
    map<Alien *, int>::iterator it = physicsAliens.begin();
    for (; it!=physicsAliens.end(); it++) {
        Alien * alien = it->first;
        if (!alien->isNeedToClear) {
            map<int,int>::iterator itColor = colors.find(alien->figure->color_index);
            if (itColor!=colors.end()) {
                itColor->second++;
            }else{
                colors.insert(make_pair(alien->figure->color_index, 1));
            }
        }
    }
    int color=0,count = 0;
    for (map<int,int>::iterator it2 = colors.begin(); it2!=colors.end(); it2++) {
        if (count<it2->second) {
            count = it2->second;
            color = it2->first;
        }
    }
    return color;
}

bool AliensManager::checkTouchToKill(CCPoint touchPoint)
{
    if (CosmoBonuses::getInstance()->isActiveBonus(BT_TOUCH_TO_KILL)) {
        map<Alien *, int>::iterator it = physicsAliens.begin();
        for (; it!=physicsAliens.end(); it++) {
            Alien * alien = it->first;
            LHSprite * sprite = alien->getSprite();
            if (sprite!=NULL) {
                if( sprite->boundingBox().containsPoint(touchPoint) ){ ///проверяем по большому ректу
                    if( GameScene::gameScene->boundBoxFromSprite(sprite).containsPoint(touchPoint)){///проверяем по маленькому ректу
                        setClearByGroup(alien->group);
                        CosmoBonuses::getInstance()->active->decCount(1);
                        return true;
                    }
                    
                }
            }
        }
    }
    return false;
}

bool AliensManager::checkGunShot(CCPoint touchPoint)
{
    if (CosmoBonuses::getInstance()->isActiveBonus(BT_GUN)) {
        map<Alien *, int>::iterator it = physicsAliens.begin();
        for (; it!=physicsAliens.end(); it++) {
            Alien * alien = it->first;
            LHSprite * sprite = alien->getSprite();
            if (sprite!=NULL) {
                if( sprite->boundingBox().containsPoint(touchPoint) ){ ///проверяем по большому ректу
                    if( GameScene::gameScene->boundBoxFromSprite(sprite).containsPoint(touchPoint)){///проверяем по маленькому ректу
                        setClearByGroup(alien->group);
                        CosmoBonuses::getInstance()->active->decCount(1);
                        
                        return true;
                    }
                    
                }
            }
        }
    }
    return false;
}


