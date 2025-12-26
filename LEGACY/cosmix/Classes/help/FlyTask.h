//
//  FlyTask.h
//  cosmix
//
//  Created by denver on 23.09.13.
//
//

#ifndef __cosmix__FlyTask__
#define __cosmix__FlyTask__

#include "LevelHelperLoader.h"
#include "Task.h"
#include "popupMenu.h"
#include "Game.h"

class FlyTask : public CCObject
{
public:
    FlyTask(CTask * _task, float delay=1);
    ~FlyTask();
    void endFlyOfTask(CCNode * node);
    CTask *             task;
    CCLabelBMFont *     label;
    LHSprite *          starSprite;
    
    //static functions
    static void initWithMenu(PopupMenu * menu);
    
    static CCPoint  pntStartTaskCompleted;
    static CCPoint  pntEndTaskCompleted;
    static CCPoint  pntCenterTaskCompleted;

    static CCPoint  pntStartStar;
    static CCPoint  pntEndStar;
    static CCPoint  pntCenterStar;
    
    static CCPoint  pntStartText;
    static CCPoint  pntEndText;
    static CCPoint  pntCenterText;

    
};

#endif /* defined(__cosmix__FlyTask__) */
