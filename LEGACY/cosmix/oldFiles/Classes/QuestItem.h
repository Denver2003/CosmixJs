//
//  QuestItem.h
//  boltrix
//
//  Created by Den on 12.09.12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#ifndef boltrix_QuestItem_h
#define boltrix_QuestItem_h

#include "Quest.h"

#define QUESTS QuestItem::getInstance()

class QuestItem
{
protected:
    QuestItem( Quest * _quest );
    QuestItem();
    ~QuestItem();

    static QuestItem * instance;
    
public:    
    Quest * quest;
    /// working params
    int currentCount;
    bool isCanceled;
    bool isReached;
    bool isCleared;
    
    bool winWasShowing;

    void init( Quest * _quest );
    void addCount( int _type, int _count );
    void clearCount( int _type );
    void cancelCount( int _type );
    bool needToShowWindow();
    
// static 

    static QuestItem *  getInstance();
    static void         destroyInstance();
    

};

#endif
