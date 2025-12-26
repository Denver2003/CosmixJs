//
//  QuestItem.cpp
//  boltrix
//
//  Created by Den on 12.09.12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//


#include "QuestItem.h"
#include "Quest.h"

QuestItem * QuestItem::instance = NULL;

QuestItem::QuestItem( Quest * _quest )
{
    quest           = _quest;
    currentCount    = 0;
    isCanceled      = false;
    isReached       = false;
    isCleared       = false;
    winWasShowing   = false;
}

QuestItem::QuestItem()
{
    quest           = NULL;
    currentCount    = 0;
    isCanceled      = false;
    isReached       = false;
    isCleared       = false;
    winWasShowing   = false;
    
}


QuestItem::~QuestItem()
{
    
}
//init questItem with quest
void QuestItem::init(Quest *_quest)
{
    quest           = _quest;
    currentCount    = 0;
    isCanceled      = false;
    isReached       = false;
    isCleared       = false;
    winWasShowing   = false;    
}

// add count of goals to reac the Quest
void QuestItem::addCount(int _type, int _count)
{    
    if (isReached) return;
    if (isCanceled) return;
    
    if (quest) {
        if (quest->type == _type) {
            currentCount += _count;
            
            if (currentCount == quest->count ) {
                isReached = true;
            }
        }
    }
}
// clear quest to begin 
void QuestItem::clearCount(int _type)
{
    if (isReached) return;
    if (isCanceled) return;
    
    if (quest) {
        if (quest->type == _type) {
            currentCount = 0;
        }
    }
}
// cancel quest
void QuestItem::cancelCount(int _type)
{
    if (isReached) return;
    if (isCanceled) return;
    
    if (quest) {
        if (quest->type == _type) {
            isCanceled = true;
        }
    }
        
}
// check to need show achive window if reached
bool QuestItem::needToShowWindow()
{
    if (isReached) {
        if (!winWasShowing) {
            winWasShowing = true;
            return true;
        }
    }
    return false;
}

/// static 

QuestItem * QuestItem::getInstance()
{
    if (!QuestItem::instance) {
        QuestItem::instance = new QuestItem();
    }
    return QuestItem::instance;
}

void QuestItem::destroyInstance()
{
    if (QuestItem::instance) {
        delete QuestItem::instance;
        QuestItem::instance = NULL;
    }
}


