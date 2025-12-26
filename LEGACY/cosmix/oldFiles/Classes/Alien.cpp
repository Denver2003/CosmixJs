//
//  Alien.cpp
//  cosmix
//
//  Created by Den on 15.11.12.
//
//

#include "Alien.h"
#include "AliensManager.h"


Alien * Alien::alienForFunc = NULL;

//map<Alien *, int> Alien::aliens;
//-------------------------------------------------
Alien::Alien( LevelHelperLoader * loader, Figure * _figure, bool _isPhysics )
{
    spBack              = NULL;
    isPhysics           = _isPhysics;
    figure              = _figure;
                            ///set physics sprite name
	string spriteName   = figure->getBatchSpriteName();
	if(!isPhysics){
                            ///set NON physics sprite name
		spriteName      = figure->getBatchSpriteNameNoPhysics();
	}
	
	spBody = LHSprite::spriteWithName(spriteName, "types", "types.pshs");
    if (spBody) {

        spBody->prepareAnimationNamed(figure->getAnimColors(),"types.pshs");
		
		// set frame with needed color
        if( (figure->color_index >= 0) && (figure->color_index < spBody->numberOfFrames()) ){
            spBody->setFrame(figure->color_index);
        }

		// set alien tag for collides
        spBody->setTag(figure->tag);
        
		// create eyes sprite
        spEyes = LHSprite::spriteWithName(figure->getBatchSpriteNameEye(), "types", "types.pshs");
        if (spEyes) {
            spEyes->prepareAnimationNamed( figure->getAnimEyeBlink(), "types.pshs");
            spEyes->playAnimation();

            spBody->addChild(spEyes,1);
            spEyes->setAnchorPoint(ccp(0,0));
            spEyes->transformPosition(ccp(0,0));
        }
    }
    
	isClearingSoon      = false;
	isNeedToClear		= false;
	countCollided		= 0;
    prevCountCollided   = 0;
	timeToClear         = 0;
    group               = -1; /// not in group now
	collidedAliens.clear();
    isNeedToDelete      = false;
	animState			= ANIM_STATE_NORMAL;
	timeToNextBlinking  = 1.0;
    isPulsing           = false;
	genNewTimeToNextBlink();
}
//-------------------------------------------------
Alien::Alien()
{
        //dummy
}
//-------------------------------------------------
Alien::~Alien()
{
    //aliens.erase(this);
    
    if (spBody) {
        spBody->removeSelf();
    }
    
    if (spEyes) {
        spEyes->removeSelf();
    }

    if (spBack) {
        spBack->removeSelf();
    }

}
Alien * Alien::getForFunc()
{
    if (!Alien::alienForFunc) {
        Alien::alienForFunc = new Alien();
    }
    return Alien::alienForFunc;
}
//-------------------------------------------------
LHSprite * Alien::getSprite()
{
    return spBody;
    
}
//-------------------------------------------------
void Alien::updatePosition()
{
    return;
    LHSprite *tmpSprite = NULL;
    if (spBody) {
        if (spEyes) {
            tmpSprite = spEyes;
            if ( ( spBody->getPosition().x != tmpSprite->getPosition().x )
                ||(spBody->getPosition().y != tmpSprite->getPosition().y) ){
                
                tmpSprite->transformPosition(spBody->getPosition());
            }
            
            if (spBody->getScaleX() != tmpSprite->getScaleX()) {
                tmpSprite->transformScaleX(spBody->getScaleX());
            }

            if (spBody->getScaleY() != tmpSprite->getScaleY()) {
                tmpSprite->transformScaleY(spBody->getScaleY());
            }
            
            if (spBody->getRotation() != tmpSprite->getRotation()) {
                tmpSprite->transformRotation(spBody->getRotation());
            }
        }
        if (spBack) {
            tmpSprite = spBack;
            if ( ( spBody->getPosition().x != tmpSprite->getPosition().x )
                ||(spBody->getPosition().y != tmpSprite->getPosition().y) ){
                
                tmpSprite->transformPosition(spBody->getPosition());
            }
            
            if (spBody->getScaleX() != tmpSprite->getScaleX()) {
                tmpSprite->transformScaleX(spBody->getScaleX());
            }
            
            if (spBody->getScaleY() != tmpSprite->getScaleY()) {
                tmpSprite->transformScaleY(spBody->getScaleY());
            }
            
            if (spBody->getRotation() != tmpSprite->getRotation()) {
                tmpSprite->transformRotation(spBody->getRotation());
            }
        }
        
    }
}
//-------------------------------------------------
void Alien::collide( Alien * alien ){
	if( alien!=NULL ){
		map<Alien *,int>::iterator it = this->collidedAliens.find( alien );
		if( it == collidedAliens.end() ){
			collidedAliens.insert( make_pair( alien, 1 ));
		}else{
			it->second++;
		}
	}else{
		CCLOG("Alien::collide sprite is NULL !");
	}
}
//-------------------------------------------------
bool Alien::isCollided( Alien * alien ){
	if( alien!=NULL ){
		if( collidedAliens.find( alien ) == collidedAliens.end() ){
			return false;
		}else{
			return true;
		}
	}
	return false;
}
//-------------------------------------------------
void Alien::uncollide( Alien * alien ){
	if( alien!=NULL ){
		map<Alien *,int>::iterator it = this->collidedAliens.find( alien );
		if( it == collidedAliens.end() ){
			return;
		}else{
			it->second--;
			if(it->second < 1 ){
				collidedAliens.erase( it );
			}
		}
	}
}
//-------------------------------------------------
void	Alien::uncollideAll   ( void )
{
    map<Alien *,int>::iterator it = this->collidedAliens.begin();
    for (; it!=collidedAliens.end(); it++) {
        for (int i = 0; i < it->second; i++) {
            it->first->uncollide(this);
        }
    }
    collidedAliens.clear();
}

//-------------------------------------------------
void Alien::calcCountCollided(int groupId,map<Alien *,int> *aliens){
	map<Alien *,int>::iterator itAlready;
	map<Alien *,int>::iterator itSub;
	map<Alien *,int>::iterator it = collidedAliens.begin();
    
    /// insert parent sprites to array
	itAlready = aliens->find(this);
    if (itAlready == aliens->end()) {
        aliens->insert(make_pair(this, 1));
    }
    /// check collided sprites with parent
	for(;it!=collidedAliens.end();it++){
        
		itAlready = aliens->find(it->first);
        /// if sprite not inside a array
		if( itAlready == aliens->end() ){
            /// add sprite to array
			aliens->insert(*it);
            //// get unit from sprite
            Alien *alien = it->first;
            if( alien ){
                ///find collided sprites whith sprite
                alien->calcCountCollided(groupId,aliens);
            }
		}
	}
}
//-------------------------------------------------
void Alien::preCalcUnit(){
    prevCountCollided   = countCollided;
    countCollided       = 0;
    isCalculated        = false;
}
//-------------------------------------------------
void Alien::setCalcInfo( int groupId, int count ){
    
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
//-------------------------------------------------
void   Alien::pulseFigure(){
    if ( (countCollided > 1) && ( !isPulsing ) ) {
        //CCScaleTo * scale1 = NULL;
        //CCScaleTo * scale2 = NULL;
        CCFadeTo * fade1 = NULL;
        CCFadeTo * fade2 = NULL;
        
        CCCallFuncN * endFunc = CCCallFuncN::create(Alien::getForFunc(), callfuncN_selector(Alien::endPulse));
        
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
            getSprite()->runAction(CCSequence::create(fade1,fade2,endFunc,NULL));
        }
        
    }
}
//-------------------------------------------------
void Alien::endPulse(CCNode * node)
{
    LHSprite * sprite = (LHSprite *)node;
    if (sprite) {
        Alien * alien = AliensManager::getInstance()->alienBySprite(sprite);
        if (alien) {
            alien->isPulsing = false;
        }
    }
}
//-------------------------------------------------
void Alien::animFigure( int _animState ){
	animState = _animState;
	switch(_animState){
		case ANIM_STATE_NORMAL:
        {
			//parentSprite->stopAnimation();
            
            if( spBody ){
                
                
                
				/// breath of figure
                CCScaleTo * scale1	= CCScaleTo::create( 0.5, 0.98, 1.02 );
                CCScaleTo * scale15	= CCScaleTo::create( 0.3, 0.98, 1.02 );
                CCScaleTo * scale2	= CCScaleTo::create( 0.5, 1.02, 0.98 );
                spBody->runAction( CCRepeatForever::create( (CCActionInterval*) CCSequence::create(scale1,scale15,scale2,NULL)));
                
                if( spEyes ){
                    spEyes->prepareAnimationNamed( figure->getAnimEyeWalk(), "types.pshs" );
                    spEyes->playAnimation();
                }
            }else{
                CCLOG("Alien::animFigure WRONG SPRITE ");
            }
        }
			break;
		case ANIM_STATE_BLINKING:
        {
            if(spBody){
                if( spEyes ){
                    spEyes->prepareAnimationNamed( figure->getAnimEyeBlink(), "types.pshs" );
                    spEyes->playAnimation();
                    CCNotificationCenter::sharedNotificationCenter()->addObserver(
                                                            (CCObject*)Alien::getForFunc(),callfuncO_selector(Alien::spriteEyeBlinkOrFallEnded), LHAnimationHasEndedNotification ,
                                                                spEyes );
                }
            }else{
                CCLOG("CFigureUnit::animFigure WRONG SPRITE ");
            }
        }
			break;
		case ANIM_STATE_BANG:
        {

            if(spBody){
                clearBlink();
                if(spBody){
                    if( spEyes ){
                        spEyes->prepareAnimationNamed( figure->getAnimEyeFall(), "types.pshs" );
                        spEyes->playAnimation();
                    }
                    
                }
            }else{
                CCLOG("CFigureUnit::animFigure WRONG SPRITE ");
            }
        }
			break;
		case ANIM_STATE_FALL:
        {
            if(spBody){
                if( spEyes ){
                    spEyes->prepareAnimationNamed( figure->getAnimEyeFall(), "types.pshs" );
                    spEyes->playAnimation();
                    CCNotificationCenter::sharedNotificationCenter()->addObserver(
                                                                                  (CCObject*)Alien::getForFunc(),callfuncO_selector(Alien::spriteEyeBlinkOrFallEnded), LHAnimationHasEndedNotification ,
                                                                                  spEyes );
                }
            }else{
                CCLOG("CFigureUnit::animFigure WRONG SPRITE ");
            }
        }
			break;
            
	};
}
//-------------------------------------------------
void Alien::spriteEyeBlinkOrFallEnded(CCObject * object)
{
	CCLog("Alien::spriteEyeBlinkOrFallEnded(CCObject * object)");
    
    LHSprite *      eyespr             = (LHSprite*) object;
    if (!eyespr) {
        return;
    }

    LHSprite *      sprite = (LHSprite *)eyespr->getParent();
    
    if (sprite) {
        Alien * alien = AliensManager::getInstance()->alienBySprite(sprite);
        if (alien) {
            alien->genNewTimeToNextBlink();
            alien->animFigure( ANIM_STATE_NORMAL );
        }
    }
}
//----------------------------------------
void Alien::updateBlink(float tick){
	if( ( timeToNextBlinking != 0 ) ){
		if( timeToNextBlinking - tick <= 0 ){
			timeToNextBlinking = 0;
			animFigure( ANIM_STATE_BLINKING );
		}else{
			timeToNextBlinking = timeToNextBlinking - tick;
		}
	}
}
//----------------------------------------
void	Alien::genNewTimeToNextBlink(){
	timeToNextBlinking = CCRANDOM_0_1() * (ANIM_BLINK_TIME_TO - ANIM_BLINK_TIME_TO) + ANIM_BLINK_TIME_FROM;
}
//----------------------------------------
void	Alien::clearBlink(){
	timeToNextBlinking = -999.9;
}



