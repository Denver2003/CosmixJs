//
//  PlayEvents.h
//  cosmix
//
//  Created by denver on 05.09.13.
//
// class for game events like get points, game over, combo and more...
// this class need to make easy task managment

#ifndef __cosmix__PlayEvents__
#define __cosmix__PlayEvents__

#include "cocos2d.h"
#include "Bonus.h"
#include "Task.h"
USING_NS_CC;

class PlayEvents {
public:
    // TEMP VALUES
    int figuresCleared;
    int burstBubbles;
    int figuresFallenBonus;
    int maxFiguresCleared;
    int megaComboCount;
    int superComboCount;
    int cosmoComboCount;
    int coinsCount;
    int scoreWithoutBonus;
    int scoreWithBonus;
    int grenadeFigures;
    
    struct cc_timeval gameTime;

    ///////
    //-------GAME-EVENTS-----------
    
    
    void onStartGame();
    void onGameOver();
    void onReachLevel(int level); 
    void onScorePoint(int point);
    void onTouchBubble(BonusItem * bonusItem);
    void onCreateBubble(BonusItem * bonusItem);
    void onCreateFigure(Alien * alien);
    void onStartControlFigure(Alien * alien);
    void onClearFigure(Alien * alien); 
    void onClearFigures(int countFigures); 
    void onGetCoin(int coins);
    void onGetPointBonus(int points, int type);
    void onUseGrenade(int color, int count); 
    void onFallBonus(std::vector<Alien *> aliens );
    void onFallingFigures(std::vector<Alien *> aliens );
    
    void onCombo2x(void);
    void onCombo3x(void);
    void onSuperCombo(void);
    void onMegaCombo(void);
    void onCosmoCombo(void);

    void onUseTouchToKillBonus(void);
    void onUseGunBonus(void);
    void onUseCosmoBombBonus(void);
    void onPickUpTouchToKillBonus(void);
    void onPickUpGunBonus(void);
    void onPickUpCosmoBombBonus(void);
    void onUpCosmoMeter2xPoint(void);
    void onDownCosmoMeter2xPoint(void);
    void onUpCosmoMeter3xPoint(void);
    void onDownCosmoMeter3xPoint(void);
    void onUpCosmoMeter5xPoint(void);
    void onDownCosmoMeter5xPoint(void);
    void onUpCosmoMeterMax(void);
    void onTutorialStarted(void);//*
    void onTutorialEnded(void);//*
    
    void onTaskIsDone(CTask * task);//*
    void onTaskIsFailed(CTask * task);//*
    void onShowMainMenu(void);
    void onShowRatingMenu(void);//*
    void onShowPauseMenu(void);
    void onShowGameOverMenu(void);
    void onShowTaskMenu(void);//*
    void onResumePlay(void);
    void onSaveAll(void);
    void onTest(void);
    //-------GAME-EVENTS-----------
    void sendStatistics();
    void initGameplayInterval();
    float calcGameplayInterval();
    
    //-----------------------------
    static PlayEvents * getInstance();
    static void destroyInstance();
private:
    PlayEvents();
    ~PlayEvents();
    
    static PlayEvents * mInstance;

};


#endif /* defined(__cosmix__PlayEvents__) */
