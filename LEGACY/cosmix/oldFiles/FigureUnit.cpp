//
//  FigureUnit.cpp
//  Boltrix
//
//  Created by Den on 19.03.12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//
#include "FigureUnit.h"
#include "GameScene.h"
#include "Figure.h"
#include "Bonus.h"

vector<LHSprite *>              CFigureUnit::allSprites;    
map<LHSprite *, CFigureUnit *>  CFigureUnit::units;



CFigureUnit::CFigureUnit( LHSprite * sprite, Figure * _figureTemplate ){
	CCLOG("CFigureUnit::CFigureUnit sprite = %s, figure = %s",
		sprite->getUniqueName().c_str(),_figureTemplate->animPrefix.c_str());

	this->parentSprite		= sprite;
	this->isClearingSoon	= false;
	this->isNeedToClear		= false;
	this->countCollided		= 0;
    this->prevCountCollided = 0;
	this->timeToClear		= 0;
    this->group             = -1; /// not in group now
	this->collidedSprites.clear();
    this->isNeedToDelete     = false;
    this->figureTemplate     = _figureTemplate;
	this->animState			 = ANIM_STATE_NORMAL;
	this->timeToNextBlinking = 1.0;
    isPulsing                = false;    
	genNewTimeToNextBlink();
}

CFigureUnit::~CFigureUnit(){
	CCLOG("CFigureUnit::~CFigureUnit");
}

void CFigureUnit::collide( LHSprite * sprite ){
	if( sprite!=NULL ){
		map<LHSprite *,int>::iterator it = this->collidedSprites.find( sprite );
		if( it == collidedSprites.end() ){
			CCLOG("CFigureUnit::collide %s insert collided sprite = %s ", 
				this->parentSprite->getUniqueName().c_str(), sprite->getUniqueName().c_str());
			collidedSprites.insert( make_pair( sprite, 1 ));
		}else{
			CCLOG("CFigureUnit::collide %s add count collided sprite = %s ",
				this->parentSprite->getUniqueName().c_str(), sprite->getUniqueName().c_str());
			it->second++;
		}
	}else{
		CCLOG("CFigureUnit::collide sprite is NULL !");
	}
}

bool CFigureUnit::isCollided( LHSprite * sprite ){
	if( sprite!=NULL ){
		if( collidedSprites.find( sprite ) == collidedSprites.end() ){
			return false;
		}else{
			return true;
		}
	}
	return false;
}

void CFigureUnit::uncollide( LHSprite * sprite ){
	if( sprite!=NULL ){
		map<LHSprite *,int>::iterator it = this->collidedSprites.find( sprite );
		if( it == collidedSprites.end() ){
			CCLOG("CFigureUnit::uncollide %s not found collided sprite %s ",
				this->parentSprite->getUniqueName().c_str(), sprite->getUniqueName().c_str());
			return;
		}else{
			it->second--;
			CCLOG("CFigureUnit::uncollide %s decrease collide counter for sprite %s ",
				this->parentSprite->getUniqueName().c_str(), sprite->getUniqueName().c_str());
			if(it->second < 1 ){
				collidedSprites.erase( it );
				CCLOG("CFigureUnit::uncollide %s delete sprite from collided %s ",
					this->parentSprite->getUniqueName().c_str(), sprite->getUniqueName().c_str());
			}
		}
	}
}

void CFigureUnit::calcCountCollided(int groupId,map<LHSprite *,int> *sprites){
	//map<LHSprite *,int> sprites;
	map<LHSprite *,int>::iterator itAlready;
	map<LHSprite *,int>::iterator itSub;
	map<LHSprite *,int>::iterator it = collidedSprites.begin();
    
    /// insert parent sprites to array
	itAlready = sprites->find(parentSprite);
    if (itAlready == sprites->end()) {
        sprites->insert(make_pair(parentSprite, 1));
    }
    /// check collided sprites with parent
	for(;it!=collidedSprites.end();it++){

		itAlready = sprites->find(it->first);
        /// if sprite not inside a array
		if( itAlready == sprites->end() ){
            /// add sprite to array
			sprites->insert(*it);
            //// get unit from sprite
            CFigureUnit * unit = CFigureUnit::unitFromSprite(it->first);
            /// check unit available
            if( unit ){
                ///find collided sprites whith sprite
                unit->calcCountCollided(groupId,sprites);
            }
		}
	}
}

void CFigureUnit::preCalcUnit(){
    prevCountCollided   = countCollided;
    countCollided       = 0;
    isCalculated        = false;
}

void CFigureUnit::setCalcInfo( int groupId, int count ){
    
    group           = groupId;
    countCollided   = count;
    isCalculated    = true;

    if (countCollided>=MIN_COLLIDED_CLEAR && prevCountCollided < MIN_COLLIDED_CLEAR) {
        /// start timer
        isClearingSoon      = true;
        timeToClear         = CHECK_TIME_COLLIDE;
        isNeedToClear       = false;
        
        
    }else if (countCollided<MIN_COLLIDED_CLEAR && prevCountCollided >= MIN_COLLIDED_CLEAR) {
        /// abort timer
        isClearingSoon      = false;
        timeToClear         = 0;
        isNeedToClear       = false;

    }else if (countCollided>=MIN_COLLIDED_CLEAR) {
        /// waiting timer
        /// abort timer
    }else{
        /// abort timer
        isClearingSoon      = false;
        timeToClear         = 0;
        isNeedToClear       = false;
    }
    
    
}

void   CFigureUnit::pulseFigure(){
    if ( (countCollided > 1) && ( !isPulsing ) ) {
        //CCScaleTo * scale1 = NULL;
        //CCScaleTo * scale2 = NULL;
        CCFadeTo * fade1 = NULL;
        CCFadeTo * fade2 = NULL;
        
        CCCallFuncN * endFunc = CCCallFuncN::create(GameScene::gameScene, callfuncN_selector(GameScene::endPulse));

        if ( countCollided >= MIN_COLLIDED_CLEAR ) {
            //scale1 = CCScaleTo::actionWithDuration(0.4, 2.1);
            //scale2 = CCScaleTo::actionWithDuration(0.4, 1);
            fade1 = CCFadeTo::create(0.3, 200 );
            fade2 = CCFadeTo::create(0.3, 256 );
        }else if (countCollided == MIN_COLLIDED_CLEAR - 1 ) {
            fade1 = CCFadeTo::create(0.5, 200 );
            fade2 = CCFadeTo::create(0.5, 256 );
            
        }else if (countCollided == MIN_COLLIDED_CLEAR - 2) {
            fade1 = CCFadeTo::create(1, 200 );
            fade2 = CCFadeTo::create(1, 256 );
        }
        if (fade1 && fade2 && endFunc) {
            isPulsing = true;
            parentSprite->runAction(CCSequence::create(fade1,fade2,endFunc,NULL));
        }

    }
}

void CFigureUnit::changeParentSprite( LHSprite * sprite ){
	if (sprite) {
        map<LHSprite * , CFigureUnit *>::iterator it = CFigureUnit::units.begin();
        for (; it != CFigureUnit::units.end(); it++) {
            if (it->second == this) {
                CFigureUnit::units.erase(it);
                break;
            }
        }
    }

    CFigureUnit::units.insert(make_pair(sprite, this));
    parentSprite = sprite;

/*    
    if( !sprite ) {
		CCLOG( "CFigureUnit::changeParentSprite WRONG SPRITE" );
		return;
	}

	//CFigureUnit::removeSprite( parentSprite );
	parentSprite = sprite;
	parentSprite->setCustomValue( (void*) 1, "hasUnit" );
	parentSprite->setCustomValue( (void*) this, "unit" );
	CCLOG( "CFigureUnit::changeParentSprite change sprite %s", sprite->getUniqueName().c_str() );
 */
}

////    static functions     /////
void CFigureUnit::collide( LHSprite * spriteA, LHSprite * spriteB ){
	if( spriteA != NULL && spriteB != NULL){
		CFigureUnit * unitA = CFigureUnit::unitFromSprite(spriteA);
		CFigureUnit * unitB = CFigureUnit::unitFromSprite(spriteB);
		if(unitA!=NULL && unitB!=NULL){
			unitA->collide( spriteB );
			unitB->collide( spriteA );
            CFigureUnit::calculate();
		}
	}
}

void CFigureUnit::uncollide( LHSprite * spriteA, LHSprite * spriteB ){
	if( spriteA != NULL && spriteB != NULL){
		CFigureUnit * unitA = CFigureUnit::unitFromSprite(spriteA);
		CFigureUnit * unitB = CFigureUnit::unitFromSprite(spriteB);
		if(unitA!=NULL && unitB!=NULL){
			unitA->uncollide( spriteB );
			unitB->uncollide( spriteA );
            CFigureUnit::calculate();
		}
	}
}

CFigureUnit * CFigureUnit::unitFromSprite( LHSprite * sprite ){
    if (sprite) {
        map<LHSprite *, CFigureUnit *>::iterator it = CFigureUnit::units.find(sprite);
        if (it != CFigureUnit::units.end()) {
            return it->second;
        }
        return NULL;
    }
    return NULL;
    /*
    
	if( sprite != NULL ){
        int hasUnit = ( int )sprite->getCustomValueWithKey("hasUnit");
        if (hasUnit == 1) {
            CFigureUnit * unit = ( CFigureUnit * )sprite->getCustomValueWithKey("unit");
            return unit;
        }else{
			CCLOG("CFigureUnit::unitFromSprite HAS NO UNIT!");
            return NULL;
        }
	}else{
		CCLOG("CFigureUnit::unitFromSprite WRONG SPRITE");
		return NULL;
	}
     */

}

CFigureUnit * CFigureUnit::createUnitForSprite( LHSprite * sprite, Figure * _figureTemplate ){
    if (sprite) {
        CFigureUnit * unit = unitFromSprite(sprite);
        if ( !unit ) {
            unit = new CFigureUnit( sprite, _figureTemplate );
            CFigureUnit::units.insert( make_pair(sprite, unit) );
            return unit;
        }else{
            CCLOG("CFigureUnit::createUnitForSprite SPRITE ALREADY HAVE UNIT %s", sprite->getUniqueName().c_str());
            return NULL;
        }
        
    }
    CCLOG("CFigureUnit::createUnitForSprite SPRITE ERROR!!!");
    return NULL;
    /*
	if( sprite != NULL ){
		CFigureUnit * unit = new CFigureUnit( sprite, _figureTemplate );
        sprite->setCustomValue( (void*) 1, "hasUnit" );
		sprite->setCustomValue( (void*) unit, "unit" );
        
		return unit;
	}else{
		CCLOG("CFigureUnit::createUnitForSprite WRONG SPRITE");
		return NULL;
	}
     */
}

bool CFigureUnit::clearUnitFromSprite( LHSprite * sprite ){
    if (sprite) {
        map<LHSprite *, CFigureUnit *>::iterator it = CFigureUnit::units.find(sprite);
        
        if (it != CFigureUnit::units.end()) {
            CFigureUnit * unit = it->second;
            CFigureUnit::units.erase(it);
            delete unit;
            return true;
        }
        return false;
    }
    return false;

    /*
    
	if( sprite != NULL ){
		CFigureUnit * unit = CFigureUnit::unitFromSprite(sprite);
		delete unit;
        sprite->setCustomValue( (void*) -1, "hasUnit" );
		//sprite->setCustomValue(NULL,"unit");
	}else{
		CCLOG("CFigureUnit::clearUnitFromSprite WRONG SPRITE");
	}
	return false;
     */
}

void CFigureUnit::initUnits()
{
    clearSprites();
}

void CFigureUnit::clearSprites(void)
{
	CCLOG("CFigureUnit::clearSprites");
    vector<LHSprite*>::iterator it = allSprites.begin();
    for (; it!=allSprites.end(); it++) {
        CFigureUnit * unit =  CFigureUnit::unitFromSprite(*it);
        if (unit!=NULL) {
            delete unit;
        }
    }
    units.clear();
    allSprites.clear();
}

void CFigureUnit::addSprite(LHSprite * sprite)
{
	if( !sprite ){
		CCLOG("CFigureUnit::addSprite WRONG SPRITE");
		return;
	}
	CCLOG("CFigureUnit::addSprite add sprite %s", sprite->getUniqueName().c_str());
    allSprites.push_back(sprite);
}
    
void CFigureUnit::removeSprite(LHSprite * sprite){
	if( !sprite ){
		CCLOG("CFigureUnit::removeSprite WRONG SPRITE");
		return;
	}
    vector<LHSprite*>::iterator it = allSprites.begin();
    for (; it!=allSprites.end(); it++) {
        if (*it == sprite) {
            allSprites.erase(it);
			CCLOG("CFigureUnit::removeSprite remove %s", sprite->getUniqueName().c_str());
            break;
        }
    }
}

void CFigureUnit::preCalculate(){
    vector<LHSprite*>::iterator it = allSprites.begin();
    for (; it!=allSprites.end(); it++) {
        CFigureUnit * unit = unitFromSprite(*it);
        if (unit!=NULL) {
            unit->preCalcUnit();
        }else{
			CCLOG("CFigureUnit::preCalculate WRONG UNIT");
		}
    }
    
}

void CFigureUnit::calcGroup(CFigureUnit * unit, int groupId){
	if( !unit ){
		CCLOG("CFigureUnit::calcGroup WRONG UNIT1");
		return;
	}    

    map<LHSprite*,int> sprites;
    unit->calcCountCollided(groupId,&sprites);
    
    map<LHSprite*,int>::iterator it = sprites.begin();
    for (; it!=sprites.end(); it++) {
        CFigureUnit * unit2 = CFigureUnit::unitFromSprite(it->first);
		if(unit2){

			unit2->setCalcInfo(groupId, sprites.size());
		}else{
			CCLOG("CFigureUnit::calcGroup WRONG UNIT2");
		}
    }
    
    sprites.clear();
    //CCLog( "GROUP %d has %d figures!", groupId, sprites.size() );
}

void CFigureUnit::calculate(){
    preCalculate(); /// init calculation
    int groupIndex = 0;
    vector<LHSprite*>::iterator it = allSprites.begin();
    for (; it!=allSprites.end(); it++) {
        CFigureUnit * unit = CFigureUnit::unitFromSprite(*it);
        if (unit!=NULL) {
            if (!unit->isCalculated) {
                CFigureUnit::calcGroup(unit, groupIndex++);
            }
        }else{
			CCLOG(" CFigureUnit::calculate WRONG UNIT");
		}
    }
}

void CFigureUnit::animFigure( int _animState ){
	animState = _animState;
	switch(_animState){
		case ANIM_STATE_NORMAL:
			{
			//parentSprite->stopAnimation();
					
				if(parentSprite){
					CCLOG("CFigureUnit::animFigure ANIM_STATE_NORMAL : %s ",parentSprite->getUniqueName().c_str());
					//parentSprite->startAnimationNamed( figureTemplate->getAnimWalkName() );
                    parentSprite->prepareAnimationNamed( figureTemplate->getAnimWalkName(), "newTypes.pshs" );
                    parentSprite->playAnimation();
                    
				/// breath of figure
					CCScaleTo * scale1	= CCScaleTo::create( 0.5, 0.98, 1.02 );
					CCScaleTo * scale15	= CCScaleTo::create( 0.3, 0.98, 1.02 );
					CCScaleTo * scale2	= CCScaleTo::create( 0.5, 1.02, 0.98 );
					parentSprite->runAction( CCRepeatForever::create( (CCActionInterval*) CCSequence::create(scale1,scale15,scale2,NULL)));

					LHSprite * topSprite = GameScene::gameScene->getTopSpriteFor( parentSprite );
					if( topSprite ){
                        topSprite->prepareAnimationNamed( figureTemplate->getAnimEyeWalk(), "newTypes.pshs" );
                        topSprite->playAnimation();
                        
                        //	topSprite->startAnimationNamed( figureTemplate->getAnimEyeWalk() );
					}
				}else{
					CCLOG("CFigureUnit::animFigure WRONG SPRITE ");	
				}
			}
			break;
		case ANIM_STATE_BLINKING:
			{
			//parentSprite->stopAnimation();

				if(parentSprite){
					CCLOG("CFigureUnit::animFigure ANIM_STATE_BLINKING : %s ",parentSprite->getUniqueName().c_str());
                    parentSprite->prepareAnimationNamed(figureTemplate->getAnimBlinkName(), "newTypes.pshs");
                    parentSprite->playAnimation();
                    CCNotificationCenter::sharedNotificationCenter()->addObserver((CCObject*)GameScene::gameScene, callfuncO_selector(GameScene::spriteAnimHasEnded), LHAnimationHasEndedNotification , parentSprite );
                    
					/*parentSprite->startAnimationNamed( figureTemplate->getAnimBlinkName(),0,(CCObject*)GameScene::gameScene,callfuncND_selector( GameScene::spriteAnimHasEnded ));*/
				
					LHSprite * topSprite = GameScene::gameScene->getTopSpriteFor( parentSprite );
					if( topSprite ){
                        topSprite->prepareAnimationNamed(figureTemplate->getAnimBlinkName(), "newTypes.pshs");
                        topSprite->playAnimation();
                        
						//topSprite->startAnimationNamed( figureTemplate->getAnimEyeBlink() );
					}
				}else{
					CCLOG("CFigureUnit::animFigure WRONG SPRITE ");	
				}
			}
			break;
		case ANIM_STATE_BANG:
			{
			//parentSprite->stopAnimation();
				if(parentSprite){
					CCLOG("CFigureUnit::animFigure ANIM_STATE_BANG : %s ",parentSprite->getUniqueName().c_str());
					clearBlink();
					//parentSprite->startAnimationNamed( figureTemplate->getAnimBangName() );
                    parentSprite->prepareAnimationNamed(figureTemplate->getAnimBangName(), "newTypes.pshs");
                    parentSprite->playAnimation();

						LHSprite * topSprite = GameScene::gameScene->getTopSpriteFor( parentSprite );
						if( topSprite ){
							//topSprite->startAnimationNamed( figureTemplate->getAnimEyeWalk() );
                            topSprite->prepareAnimationNamed(figureTemplate->getAnimEyeWalk(), "newTypes.pshs");
                            topSprite->playAnimation();
                            
						}
				}else{
					CCLOG("CFigureUnit::animFigure WRONG SPRITE ");	
				}
			}
			break;
	};
}

void CFigureUnit::updateBlink(float tick){
	if( ( timeToNextBlinking != 0 ) ){
		if( timeToNextBlinking - tick <= 0 ){
			timeToNextBlinking = 0;
			animFigure( ANIM_STATE_BLINKING );
		}else{
			timeToNextBlinking = timeToNextBlinking - tick;
		}
	}
}

void	CFigureUnit::genNewTimeToNextBlink(){
	timeToNextBlinking = CCRANDOM_0_1() * (ANIM_BLINK_TIME_TO - ANIM_BLINK_TIME_TO) + ANIM_BLINK_TIME_FROM;
	if(parentSprite)
		CCLOG("CFigureUnit::genNewTimeToNextBlink new time = %f for sprite %s", timeToNextBlinking, parentSprite->getUniqueName().c_str());	
}
	
void	CFigureUnit::clearBlink(){
	timeToNextBlinking = -999.9;
}

void CFigureUnit::updateTime( float tick ){
    vector<LHSprite*>::iterator it = allSprites.begin();
    for (; it!=allSprites.end(); it++) {
        CFigureUnit * unit = CFigureUnit::unitFromSprite(*it);
        if (unit!=NULL) {
            if (unit->isClearingSoon) {
                unit->timeToClear-=tick;
                if (unit->timeToClear < 0 && !unit->isNeedToClear) {
                    unit->isNeedToClear = true;
                    CFigureUnit::setClearByGroup(unit->group);
                }
            }
			unit->updateBlink( tick );
            //unit->pulseFigure();
        }else{
			CCLOG("CFigureUnit::updateTime WRONG UNIT");
		}
    }
    
    removeCollidedSprite();
    
   
}

vector<LHSprite *> CFigureUnit::spritesByGroup(int groupId){
    vector<LHSprite *> sprites;
    vector<LHSprite*>::iterator it = allSprites.begin();
    for (; it!=allSprites.end(); it++) {
        CFigureUnit * unit = CFigureUnit::unitFromSprite(*it);
        if (unit!=NULL) {
            if (unit->group == groupId) {
                sprites.push_back(*it);
            }
        }else{
			CCLOG("CFigureUnit::spritesByGroup WRONG UNIT");
		}
    }
    return sprites;
}
//// сокращение группы!!!!
void CFigureUnit::setClearByGroup(int groupId){
    float minX = 99999.9, maxX = -9999.0;
    float minY = 99999.9, maxY = -9999.0;
    CCPoint pos;
    int clearCount = 0;
    vector<LHSprite*>::iterator it = allSprites.begin();
    for (; it!=allSprites.end(); it++) {
        CFigureUnit * unit = CFigureUnit::unitFromSprite(*it);
        if (unit!=NULL) {
            if (unit->group == groupId) {
                unit->isNeedToClear = true;
                unit->isNeedToDelete = true;
                //unit->collidedSprites.clear();
                pos = unit->parentSprite->getPosition();
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
                
                CCLog("CFigureUnit::setClearByGroup set isNeedToDelete = true for sprite %s!",(*it)->getUniqueName().c_str());
                
                
            }
        }else{
			CCLOG("CFigureUnit::setClearByGroup WRONG UNIT");
		}
    }
    /// орпеделение центральной позиции группы
    pos.x = minX + ((maxX - minX)/2);
    pos.y = minY + ((maxY - minY)/2);
    /// вызвать сокращение группы и определение комбо!!!
    int comboCnt = GameScene::gameScene->checkCombo(pos);
    
	Bonus::calcBonuses( clearCount, pos, comboCnt );
	
}

int CFigureUnit::getCountByTag(int tag){
    int count = 0;
    vector<LHSprite*>::iterator it = allSprites.begin();
    for (; it!=allSprites.end(); it++) {
        CFigureUnit * unit = CFigureUnit::unitFromSprite(*it);
        if (unit!=NULL) {
            if (unit->figureTemplate->tag == tag) {
                count++;
            }
            
        }
    }
    return count;
}

Figure * CFigureUnit::getMaxFiguresOnLevel(){
    Figure * maxFigure = NULL;
    map<Figure *, int> figuresCount;
    map<Figure *, int>::iterator It;
    vector<LHSprite*>::iterator it = allSprites.begin();
    for (; it!=allSprites.end(); it++) {
        CFigureUnit * unit = CFigureUnit::unitFromSprite(*it);
        if (unit!=NULL) {
            
             It = figuresCount.find(unit->figureTemplate);
            if (It == figuresCount.end()) {
                figuresCount.insert(make_pair(unit->figureTemplate, 1));
            }else {
                It->second++;
            }
        }
    }
    int MaxCount = 0;
    if (figuresCount.size() > 0) {
        for (It = figuresCount.begin(); It != figuresCount.end(); It++) {
            if ((!maxFigure) || MaxCount < It->second ) {
                maxFigure = It->first;
                MaxCount = It->second;
            }
        }
    }
    figuresCount.clear();
    
    return maxFigure;
}



//// сокращение группы!!!!
void CFigureUnit::setClearByColor(int tag, int count){
    float minX = 99999.9, maxX = -9999.0;
    float minY = 99999.9, maxY = -9999.0;
    CCPoint pos;
    int clearCount = 0;
    vector<LHSprite*>::iterator it = allSprites.begin();

    for (; it!=allSprites.end(); it++) {
        CFigureUnit * unit = CFigureUnit::unitFromSprite(*it);
        if (unit!=NULL) {
            
            if (unit->figureTemplate->tag == tag ) {
                
                    unit->isNeedToClear = true;
                    unit->isNeedToDelete = true;
                    //unit->collidedSprites.clear();
                    
                    pos = unit->parentSprite->getPosition();
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
			CCLOG("CFigureUnit::setClearByColor WRONG UNIT");
		}
    }
    /// орпеделение центральной позиции группы
    pos.x = minX + ((maxX - minX)/2);
    pos.y = minY + ((maxY - minY)/2);
    /// вызвать сокращение группы и определение комбо!!!
    if (clearCount >=4) {
        int comboCnt = GameScene::gameScene->checkCombo(pos);
    	Bonus::calcBonuses( clearCount, pos, comboCnt );
    }
	
}

void CFigureUnit::removeCollidedSprite(){
    vector<LHSprite*>::iterator it = allSprites.begin();
    for (; it!=allSprites.end(); it++) {
        LHSprite * sprite = *it;
        if (sprite!=NULL) {
            CFigureUnit * unit = CFigureUnit::unitFromSprite(sprite);
            if (unit!=NULL) {
                string name = (*it)->getUniqueName();
                if (unit->isNeedToDelete) {
                    
                    unit->collidedSprites.clear();
                    *it = NULL;
                    allSprites.erase(it);


					                    
					// create dieing sprite animation
                    LHSprite * dieSprite = GameScene::gameScene->loader->createBatchSpriteWithUniqueName(unit->figureTemplate->getSpriteName());
                    dieSprite->setPosition(sprite->getPosition());
                    dieSprite->setRotation(sprite->getRotation());
                    dieSprite->setScaleX(sprite->getScaleX());
                    dieSprite->setScaleY(sprite->getScaleY());
                    dieSprite->setTag(DELETING_SPRITE);
					//dieSprite->setColor( sprite->getColor() );
					string dieAnimName = unit->figureTemplate->getAnimBangName();
					dieAnimName = "bang";
					CCLOG( "CFigureUnit::removeCollidedSprite Spritename: [%s]", sprite->getUniqueName().c_str());

                    dieSprite->prepareAnimationNamed(dieAnimName, "newTypes.pshs" );
                    dieSprite->playAnimation();
                    CCNotificationCenter::sharedNotificationCenter()->addObserver((CCObject*)GameScene::gameScene, callfuncO_selector(GameScene::spriteAnimHasEnded), LHAnimationHasEndedNotification, dieSprite);
                    
                    /*dieSprite->startAnimationNamed(dieAnimName,0,
                                                   (CCObject*)GameScene::gameScene,
                                                   callfuncND_selector( GameScene::spriteAnimHasEnded ));*/

					CCScaleTo * scaleAction	= CCScaleTo::create( 1, 3, 3 );
					CCMoveBy * moveAction	= CCMoveBy::create( 1, ccp(0, 100) );
					dieSprite->runAction(scaleAction);
					dieSprite->runAction(moveAction);

					GameScene::gameScene->scoreHitAtPosition( sprite->getPosition(), unit->countCollided );
                    LevelLoader::getInstance()->addCleared(1);
                    //
                    CFigureUnit::clearUnitFromSprite(sprite);

                    if( GameScene::gameScene->fallingSprite == sprite ){
                        GameScene::gameScene->fallingSprite = NULL;
                    }

                    LHSprite * topSprite = GameScene::gameScene->removeTopSpriteFor(sprite);
					if( topSprite ){
                        topSprite->removeSelf();
                        topSprite = NULL;
						//GameScene::gameScene->loader->removeSprite(topSprite);
					}else{
						CCLOG("CFigureUnit::removeCollidedSprite WRONG top sprite for %s", sprite->getUniqueName().c_str());
					}
					
					string spName = sprite->getUniqueName();
                    sprite->removeSelf();
                    sprite = NULL;
					CCLOG("CFigureUnit::removeCollidedSprite try to kill sprite %s un success",spName.c_str());

                    
         			if( allSprites.size() > 0 ){
						it = allSprites.begin();
					}else{
						CCLOG("CFigureUnit::removeCollidedSprite WRONG allSprites.size()");
						break;
					}           
                    
                    //LHSprite * dieSprite = loader->ne
            //newBatchSpriteWithUniqueName(figure->getSpriteName());
                }
            }
        }
    }
}

void CFigureUnit::removeAllSprite(bool clear){

    vector<LHSprite*>::iterator it = allSprites.begin();
    for (; it!=allSprites.end(); it++) {
        LHSprite * sprite = *it;
        if (sprite!=NULL) {
            CFigureUnit * unit = CFigureUnit::unitFromSprite(sprite);
            if (unit!=NULL) {
                sprite->setTag(0);
                unit->collidedSprites.clear();
                *it = NULL;
                allSprites.erase(it);


                //it = allSprites.begin();
                CFigureUnit::clearUnitFromSprite(sprite);
                if (clear) {
                    LHSprite * topSprite = GameScene::gameScene->removeTopSpriteFor(sprite);
					if( topSprite ){
                            //GameScene::gameScene->loader->removeSprite(topSprite);
                        topSprite->removeSelf();
                        topSprite = NULL;
					}
                        //GameScene::gameScene ->loader->removeSprite(sprite);
                    sprite->removeSelf();
                    sprite = NULL;
                }
                //PlayScene::playScene->loader->removeSprite(sprite);
				if( allSprites.size() > 0 ){
					it = allSprites.begin();
				}else{
					break;
				}
            }
        }
    }
    
    allSprites.clear();
}

bool CFigureUnit::rectCollideWhithSprites(CCRect  rc){
    vector<LHSprite*>::iterator it = allSprites.begin();
    for (; it!=allSprites.end(); it++) {
        LHSprite * sprite = *it;
        if (sprite!=NULL) {
            
            
			if( rc.intersectsRect(sprite->boundingBox()) ){
                if( rc.intersectsRect( GameScene::gameScene->boundBoxFromSprite(sprite))){
					//CCLOG("CFigureUnit::rectCollideWhithSprites EOL collide with sprite %s", sprite->getUniqueName().c_str());
                    return true;    
                }
				
			}
        }
    }
	return false;
}





