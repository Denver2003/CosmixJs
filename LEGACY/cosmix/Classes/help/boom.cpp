//
//  boom.cpp
//  cosmix
//
//  Created by Den on 02.12.12.
//
//

#include "boom.h"
#include "sounds.h"
#include "game.h"
#include "Test.h"

//----------------------------------------------
CBoomSprite::CBoomSprite( Alien * alien )
{
    dieSprite = NULL;
    
    initWithAlien(alien);
    
    CCNotificationCenter::sharedNotificationCenter()->addObserver(this,
                                                                  callfuncO_selector(CBoomSprite::spriteAnimHasEnded),
                                                                  LHAnimationHasEndedNotification,
                                                                  dieSprite);
}
//----------------------------------------------
void CBoomSprite::initWithAlien( Alien * alien )
{
    if (!alien) {
        return;
    }
    
    LHSprite * sprite = alien->getSprite();
    
    if (!sprite) {
        return;
    }
    
    
    LHLayer * mLayer = Game::getLoader()->layerWithUniqueName("MAIN_LAYER");
    LHBatch * batch = mLayer->batchWithUniqueName("types");
    
    // create BANG sprite animation
    dieSprite = LHSprite::batchSpriteWithName(alien->figure->getExplosionSprite(), batch);
    
    if (!dieSprite) {
        return;
    }
    
    batch->addChild( dieSprite );
    
    dieSprite->setPosition(sprite->getPosition());
    dieSprite->setRotation(sprite->getRotation());
    dieSprite->setScaleX(sprite->getScaleX());
    dieSprite->setScaleY(sprite->getScaleY());
    dieSprite->setTag(DELETING_SPRITE);
    dieSprite->prepareAnimationNamed(alien->figure->getAnimBangName(), "types.pshs" );
    dieSprite->playAnimation();
    
    TESTLOG("CBoomSprite::initWithAlien BANG sprite = %s", dieSprite->getUniqueName().c_str() );
    
    //sound::getInstance()->playRandomSound("figure_bang");
    
    
    //CCNotificationCenter::sharedNotificationCenter()->addObserver((CCObject*)GameScene::gameScene, callfuncO_selector(GameScene::spriteAnimHasEnded), LHAnimationHasEndedNotification, dieSprite);//
    
    CCScaleTo * scaleAction	= CCScaleTo::create( 1, 2, 2 );
    CCMoveBy * moveAction	= CCMoveBy::create( 1, ccp((CCRANDOM_0_1() * 200) - 100, CCRANDOM_0_1() * 100) );
    dieSprite->runAction(scaleAction);
    dieSprite->runAction(moveAction);
    
    dieSprite->setUserObject(this);
    
}
void CBoomSprite::spriteAnimHasEnded(CCObject * object)
{

    LHSprite * sprite = (LHSprite*) object;
    if (!sprite) {
        return;
    }
    
    TESTLOG("CBoomSprite::spriteAnimHasEnded BANG sprite = %s ; animation = %s;",sprite->getUniqueName().c_str(),sprite->animationName().c_str());
    
    CBoomSprite * boom = (CBoomSprite*) sprite->getUserObject();
    if (!boom) {
        return;
    }
    
    if(boom != this){
        TESTLOG("ALARMAAAAAAAAAA CCBOOM!!!");
        return;
    }
    
    
    if (boom->dieSprite) {
        TESTLOG("CBoomSprite::spriteAnimHasEnded BANG sprite = %s ; animation = %s;",
              boom->dieSprite->getUniqueName().c_str(),
              boom->dieSprite->animationName().c_str() );
    }
    delete boom;
}

//----------------------------------------------
CBoomSprite::~CBoomSprite()
{
    if (dieSprite) {
        dieSprite->setUserObject(NULL);
        dieSprite->removeSelf();
        dieSprite = NULL;
    }
    
    CCNotificationCenter::sharedNotificationCenter()->removeObserver(this,
                                                                     LHAnimationHasEndedNotification);
}
