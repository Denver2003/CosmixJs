//
//  CosmoMeter.cpp
//  cosmix
//
//  Created by denver on 30.09.13.
//
//

#include "CosmoMeter.h"
#include "shop.h"
#include "PlayEvents.h"
#include "Test.h"

CosmoMeter * CosmoMeter::instance = NULL;

void CosmoMeter::loadFromLevel(LevelHelperLoader * loader)
{
    if (loader) {
        /// 1) загрузка спрайтов шкалы и расчет новых спрайтов для шкалы
        //грузим самый нижний спрайт
        CCPoint nextPosition;
        CCPoint lastPosition;
        LHSprite * temp = loader->spriteWithUniqueName("scaleBottom");
        if (temp) {
            bottomPosition = temp->getPosition();
            scales.push_back(temp);
        }
        temp                = loader->spriteWithUniqueName("scaleFirst");
        LHSprite * temp2    = loader->spriteWithUniqueName("scaleNext");
        if (temp && temp2) {
            shiftY = (temp2->getPosition().y - temp->getPosition().y)*0.93;
            nextPosition = temp2->getPosition();
            scales.push_back(temp);
            scales.push_back(temp2);
        }
        //получаем последний спрайт
        LHSprite * tempLast   = loader->spriteWithUniqueName("scaleLast");
        if (tempLast) {
            lastPosition = tempLast->getPosition();
            //
        }
        // генерируем спрайты шкалы
        //loader->createSpriteWithUniqueName()LHSprite* myNewSprite = loader->createSpriteWithUniqueName("UniqueName");
        int maxSpritesCount = (int)((lastPosition.y - nextPosition.y) / shiftY) + 1;

        for (int i = 1; i < maxSpritesCount; i++) {
            nextPosition.y = nextPosition.y + shiftY;
            LHSprite * nextScale = loader->createSpriteWithUniqueName("scaleNext",tempLast->getParent());
            if (nextScale) {
                nextScale->setPosition(nextPosition);
                scales.push_back(nextScale);
            }
        }
        

        //scales.push_back(tempLast);
        
        temp2   = loader->spriteWithUniqueName("scaleTop");
        if (temp2) {
            lastPosition = temp2->getPosition();
            topPosition = lastPosition;
            
            deltaScaleY = topPosition.y - bottomPosition.y;
            
            LHSprite * nextScale = loader->createSpriteWithUniqueName("scaleTop",tempLast->getParent());
            if (nextScale) {
                nextScale->setPosition(lastPosition);
                scales.push_back(nextScale);
            }
            temp2->removeSelf();
            temp2 = NULL;
        }
        
        if (tempLast) {
            tempLast->removeSelf();
            tempLast = NULL;
        }
        if (scales.size()>2) {
            scales[0]->setVisible(false);
            scales[0]->prepareAnimationNamed("scale_bottom", "cosmometer.pshs");
            scales[0]->setFrame(0);
            scales[scales.size()-1]->setVisible(false);
            scales[scales.size()-1]->prepareAnimationNamed("scale_up", "cosmometer.pshs");
            scales[scales.size()-1]->setFrame(0);

            for (int i = 1; i < scales.size()-1; i++) {
                if (scales[i]) {
                    scales[i]->setVisible(false);
                    scales[i]->prepareAnimationNamed("scale_center", "cosmometer.pshs");
                    scales[i]->setFrame(0);
                }
            }
            
            
        }
        
        maxScale = scales.size();
        
        /// 2) загрузка спрайтов ламп
        temp = loader->spriteWithUniqueName("lamp1");
        if (temp) {
            temp->prepareAnimationNamed("lamp", "cosmometer.pshs");
            lamps.push_back(temp);
        }
        temp = loader->spriteWithUniqueName("lamp2");
        if (temp) {
            temp->prepareAnimationNamed("lamp", "cosmometer.pshs");
            lamps.push_back(temp);
        }
        temp = loader->spriteWithUniqueName("lamp3");
        if (temp) {
            temp->prepareAnimationNamed("lamp", "cosmometer.pshs");
            lamps.push_back(temp);
        }
        //reOrder();
        setLevel(0);

        int step=1;
        for (int i = 0; i < scales.size(); i++) {
            if (scales[i]) {
                if (step == 1) {
                    if (scales[i]->getPosition().y >= lamps[0]->getPosition().y) {
                        level2xIndexFrom    = i - 2;
                        level2xIndexTo      = i + 2;
                        step = 2;
                    }
                }else
                    if (step == 2) {
                        if (scales[i]->getPosition().y >= lamps[1]->getPosition().y) {
                            level3xIndexFrom    = i - 2;
                            level3xIndexTo      = i + 2;
                            step = 3;
                        }
                    }else
                        if (step == 3) {
                            if (scales[i]->getPosition().y >= lamps[2]->getPosition().y) {
                                level5xIndexFrom    = i - 2;
                                level5xIndexTo      = i + 2;
                                step = 0;
                            }
                        }
            }
        }
        
        
    }
}

void CosmoMeter::reOrder(void)
{
    int zOrder = 0;
    for (int i = 0; i < scales.size() ; i++) {
        scales[i]->getParent()->reorderChild(scales[i], zOrder);
        zOrder++;
    }
    
}

void CosmoMeter::update(float dt)
{
    curfreqToDown+=dt;
    float coef = 1;
    if (is5x) {
        coef = coef5x;
    }else if (is3x) {
        coef = coef3x;
    }else if (is2x) {
        coef = coef2x;
    }
    
    if (Shop::isUpgradedTo("cosmometer", 2)) {
        coef = coef * 1.3;
    }else if (Shop::isUpgradedTo("cosmometer", 1)) {
        coef = coef * 1.15;
    }

    
    if (curfreqToDown > (freqToDown*coef)) {
        curfreqToDown = curfreqToDown - (freqToDown*coef);
        TESTLOG("moveDown");
        moveDown(1);
    }
    
    updateSprites(dt);
}

void CosmoMeter::updateSprites(float dt)
{
    static int oldLevel = -1;
    if (level != oldLevel) {
        
        for (int i = 0; i < scales.size() ; i++) {
            if (i<=level) {
                scales[i]->setVisible(true);
//                scales[i]->getParent()->reorderChild(scales[i], zOrder);
            }else{
                scales[i]->setVisible(false);
            }
        }
    }
    oldLevel = level;
}

void CosmoMeter::moveUp(int _points)
{
    static int extraPoint = 0;
    if (_points>0) {
        if (Shop::isUpgradedTo("cosmometer", 4)) {
            extraPoint++;
            if (extraPoint>=3) {
                level++;
                extraPoint = 0;
            }
        }else if (Shop::isUpgradedTo("cosmometer", 3)) {
            extraPoint++;
            if (extraPoint>=6) {
                level++;
                extraPoint = 0;
            }
        }else{
            extraPoint = 0;
        }
    }
    level += _points;
    if (level > maxScale) {
        level = maxScale;
    }else{
    }
    updateFrame();
    
}

void CosmoMeter::moveDown(int _points)
{
    level -= _points;
    if (level < -1) {
        level = -1;
    }else{
        //анимация движения шкалы вниз
    }
    updateFrame();
    
}
void CosmoMeter::setLevel(int _newLevel)
{
    level = _newLevel;
    if (level < -1) {
        level = -1;
    }
    if (level > maxScale) {
        level = maxScale;
    }
    
}
int CosmoMeter::getMultiplier(void)
{
    multiplier = 1;
    if (is5x) {
        multiplier = 5;
    }else if (is3x)
    {
        multiplier = 3;
    }else if(is2x)
    {
        multiplier = 2;
    }
    return multiplier;
}

void CosmoMeter::updateFrame()
{
    if (level == maxScale) {
        if (!isMax) {
            PlayEvents::getInstance()->onUpCosmoMeterMax();
        }
        isMax = true;
    }
    
    if (level > level2xIndexTo) {
        if (!is2x) {
            flyLabel(0);
            PlayEvents::getInstance()->onUpCosmoMeter2xPoint();

            if (Shop::isUpgradedTo("cosmometer", 5)) {
                curfreqToDown =-5;
            }
            
        }
        is2x = true;
    }
    if (level > level3xIndexTo) {
        if (!is3x) {
            flyLabel(1);
            PlayEvents::getInstance()->onUpCosmoMeter3xPoint();
            if (Shop::isUpgradedTo("cosmometer", 5)) {
                curfreqToDown =-5;
            }

        }
        is3x = true;
    }
    if (level > level5xIndexTo) {
        if (!is5x) {
            flyLabel(2);
            PlayEvents::getInstance()->onUpCosmoMeter5xPoint();
            if (Shop::isUpgradedTo("cosmometer", 5)) {
                curfreqToDown =-5;
            }
            
        }
        is5x = true;
    }

    if (level < level2xIndexFrom) {
        if (is2x) {
            PlayEvents::getInstance()->onDownCosmoMeter2xPoint();
            
            
        }
        is2x = false;
    }
    if (level < level3xIndexFrom) {
        if (is3x) {
            PlayEvents::getInstance()->onDownCosmoMeter3xPoint();
        }
        is3x = false;
    }
    if (level < level5xIndexFrom) {
        if (is5x) {
            PlayEvents::getInstance()->onDownCosmoMeter5xPoint();
        }
        is5x = false;
    }

    
    
    static int oldFrame = -1;
    frame=0;
    if (is5x) {
        frame=3;
    }else
        if (is3x) {
            frame=2;
        }else
            if (is2x) {
                frame=1;
            }
    if (frame != oldFrame) {
        for (int i = 0; i < scales.size() ; i++) {
            scales[i]->setFrame(frame);
        }
        
        for (int i = 0; i < lamps.size(); i++) {
            lamps[i]->setFrame(frame);
        }
        
        if (!is2x) {
            lamps[0]->setFrame(0);
        }
        if (!is3x) {
            lamps[1]->setFrame(0);
        }
        if (!is5x) {
            lamps[2]->setFrame(0);
        }
    }
    
    oldFrame = frame;
}

void CosmoMeter::flyLabel(int multi)
{
    CCPoint startPoint;
    std::string spriteName="";
    switch (multi) {
        case 0:
            startPoint = lamps[0]->getPosition();
            spriteName = "x2";
            break;
        case 1:
            startPoint = lamps[1]->getPosition();
            spriteName = "x3";
            break;
        case 2:
            startPoint = lamps[2]->getPosition();
            spriteName = "x5";
            break;
        default:
            break;
    }
    
    LHSprite * label = GameScene::gameScene->loader->createSpriteWithUniqueName(spriteName);
    if (label) {
        CCPoint initPoint = startPoint;
        initPoint.x = initPoint.x + label->boundingBox().size.width/2;
        label->setPosition(initPoint);
        //label->setOpacity(0);
        label->setScale(0.01);
        CCPoint center = GameScene::gameScene->comboPoint;
        CCPoint end = GameScene::gameScene->figureEndPoint;
        center.x = center.x - label->boundingBox().size.width/2;
        end.x = center.x;
        
//        CCFadeTo * fade1 = CCFadeTo::create(0.2, 255);
        label->runAction( CCSequence::create(
                           CCDelayTime::create(0.3),

                                             /*CCHide::create(),
                            CCDelayTime::create(0.05),
                            CCShow::create(),
                            CCDelayTime::create(0.05),
                                             CCHide::create(),
                                             CCDelayTime::create(0.05),
                                             CCShow::create(),
                                             CCDelayTime::create(0.05),
                                             CCHide::create(),
                                             CCDelayTime::create(0.05),
                                             CCShow::create(),
                                             CCDelayTime::create(0.05),
                                             */
                                             
/*                           CCFadeTo::create(0.1, 255),
                           CCFadeTo::create(0.1, 10),
                           CCFadeTo::create(0.1, 255),
                           CCFadeTo::create(0.1, 10),
                           CCFadeTo::create(0.1, 255),
                           CCFadeTo::create(0.1, 10),
                           CCFadeTo::create(0.1, 255),
                           CCFadeTo::create(0.1, 10),
                           CCFadeTo::create(0.2, 255),
  */
                           CCScaleTo::create(1, 1),
                           CCDelayTime::create(0.8),
                           CCFadeOut::create(2),
                           NULL)
                         );

        label->runAction( CCSequence::create(
                                             //CCFadeTo::create(0.1, 255),
                                             CCEaseBackIn::create(CCScaleTo::create(0.3, 1.2)),
                                             CCScaleTo::create(1, 1),
                                             CCEaseBackInOut::create(CCMoveTo::create(0.4,center)),
                                             CCDelayTime::create(0.8),
                                             CCMoveTo::create(3, end),
                                             CCCallFuncN::create(this, callfuncN_selector(CosmoMeter::endOfFlyLabel)),
                                             NULL
                                             )
                         );
                           
 /*        if (comboSprite) {
            CCScaleTo * scale1 = CCScaleTo::create(0.2, 1.0 );
            CCMoveBy * move1 = CCMoveBy ::create(1, ccp(0,0) );
            CCMoveBy * move2 = CCMoveBy ::create(1, ccp(0,30) );
            
            CCMoveBy * move3 = CCMoveBy ::create(1, ccp(0,0) );
            CCFadeTo * fade1 = CCFadeTo ::create(1, 0 );
            CCCallFuncN *   funcAction      = CCCallFuncN::create(this, callfuncN_selector(GameScene::removeScoreText));
            
            comboSprite->setPosition(comboPoint);
            comboSprite->setScale(2.0);
            comboSprite->runAction(CCSequence::create(scale1,move1,move2,funcAction,NULL));
            comboSprite->runAction(CCSequence::create(move3,fade1,NULL));
        }
  */
    }
}

void CosmoMeter::endOfFlyLabel(CCNode * node)
{
    LHSprite * sprite = dynamic_cast<LHSprite*>(node);
    if (sprite) {
        sprite->removeSelf();
        sprite = NULL;
    }
}

void CosmoMeter::startGame(void)
{
    TESTLOGFLIGHT("CosmoMeter::startGame(void)");
    
    setLevel(0);
    multiplier      = 1;
    is2x    = false;
    is3x    = false;
    is5x    = false;
    isMax   = false;
    updateFrame();
}

//---------------
CosmoMeter * CosmoMeter::getInstance()
{
    if (!CosmoMeter::instance) {
        CosmoMeter::instance = new CosmoMeter();
        //CosmoMeter::instance->
    }
    return CosmoMeter::instance;
    
}
void CosmoMeter::destroyInstance()
{
    if (CosmoMeter::instance) {
        delete CosmoMeter::instance;
        CosmoMeter::instance = NULL;
    }
}


CosmoMeter::CosmoMeter()
{
    level           = 0;
    
    shiftY          = 0.0;
    multiplier      = 1;
    freqToDown      = 1.9;
    curfreqToDown   = 0;
    spriteLevel     = 0;
    maxScale        = 0;
    level2xIndexFrom    = 0;
    level3xIndexFrom    = 0;
    level5xIndexFrom    = 0;
    level2xIndexTo      = 0;
    level3xIndexTo      = 0;
    level5xIndexTo      = 0;
    is2x    = false;
    is3x    = false;
    is5x    = false;
    coef2x  = 0.8;
    coef3x  = 0.5;
    coef5x  = 0.3;
}
CosmoMeter::~CosmoMeter()
{
    
}
