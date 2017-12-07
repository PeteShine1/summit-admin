/**
 * Copyright 2017 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

import
{
    REQUEST_UNSCHEDULE_EVENTS_PAGE,
    RECEIVE_UNSCHEDULE_EVENTS_PAGE,
    REQUEST_PUBLISH_EVENT,
    CHANGE_CURRENT_DAY,
    CHANGE_CURRENT_LOCATION,
    RECEIVE_SCHEDULE_EVENTS_PAGE,
    CHANGE_CURRENT_EVENT_TYPE,
    CHANGE_CURRENT_TRACK,
    CHANGE_CURRENT_PRESENTATION_SELECTION_STATUS,
    CHANGE_CURRENT_UNSCHEDULE_SEARCH_TERM
} from '../actions/summit-builder-actions';

import { LOGOUT_USER } from '../actions/auth-actions';

import { SET_CURRENT_SUMMIT } from '../actions/actions'

import SummitEvent from '../models/summit-event';

const DEFAULT_STATE = {
    scheduleEvents :  [],
    unScheduleEvents : [],
    unScheduleEventsCurrentPage : null,
    unScheduleEventsLasPage : null,
    childScheduleEvents : [],
    currentDay : null,
    currentLocation : null,
    currentEventType : null,
    currentTrack : null,
    unScheduleEventsCurrentOrder : null,
    currentPresentationSelectionStatus: null,
    unScheduleEventsCurrentSearchTerm: null
};

const scheduleBuilderReducer = (state = DEFAULT_STATE, action) => {
    const { type, payload } = action
    switch (type) {
        case RECEIVE_UNSCHEDULE_EVENTS_PAGE:
            let { data, current_page, last_page } = payload.response;
            return {...state,
                     unScheduleEvents: data,
                     unScheduleEventsCurrentPage: current_page ,
                     unScheduleEventsLasPage: last_page
                   };
        case CHANGE_CURRENT_DAY: {
            let {day} = payload;
            if(day == null){
                return {...state, currentDay : null, scheduleEvents : []};
            }
            return {...state, currentDay : day};
        }
        break;
        case CHANGE_CURRENT_EVENT_TYPE: {
            let {eventType} = payload;
            return {...state, currentEventType : eventType};
        }
        break;
        case CHANGE_CURRENT_PRESENTATION_SELECTION_STATUS: {
            let {presentationSelectionStatus} = payload;
            return {...state, currentPresentationSelectionStatus : presentationSelectionStatus};
        }
        break;
        case CHANGE_CURRENT_TRACK: {
            let {track} = payload;
            return {...state, currentTrack: track};
        }
        break;
        case CHANGE_CURRENT_LOCATION: {
            let { location } = payload;
            if(location == null){
                return {...state, currentLocation : null, scheduleEvents : []};
            }
            return {...state, currentLocation : location};
        }
        break;
        case CHANGE_CURRENT_UNSCHEDULE_SEARCH_TERM:{
            let {term} = payload;
            return {...state, unScheduleEventsCurrentSearchTerm : term};
        }
        break;
        case RECEIVE_SCHEDULE_EVENTS_PAGE:{
            let { data } = payload.response;
            return {...state,
                scheduleEvents : data
            };
        }
        break;
        case REQUEST_PUBLISH_EVENT:
            let {currentSummit, currentLocation, event, startTime, day, minutes } = payload;

            let eventModel        = new SummitEvent(event, currentSummit);
            let [eventStarDateTime, eventEndDateTime ] = eventModel.calculateNewDates(day, startTime, minutes);
            console.log(`publishing event ${event.title} - ${event.id} - start date ${eventStarDateTime.format()} - end date ${eventEndDateTime.format()}`);
            // published
            if(eventModel.isPublished()){

                let scheduleEvents = state.scheduleEvents.map(evt => { return evt.id === event.id ?  {...event,
                    start_date: eventStarDateTime.valueOf()/1000,
                    end_date: eventEndDateTime.valueOf()/1000,
                    location_id : currentLocation.id,
                    is_published: true}: evt; })
                return {...state, scheduleEvents};
            }

            // not published

            // remove from no scheduled events
            let unScheduleEvents =  state.unScheduleEvents.filter(item => event.id !== item.id);

            // main
            return {...state,
                scheduleEvents: [...state.scheduleEvents,
                    {...event,
                        start_date: eventStarDateTime.valueOf()/1000,
                        end_date: eventEndDateTime.valueOf()/1000,
                        location_id : currentLocation.id,
                        is_published: true,
                    }
                ],
                unScheduleEvents
            };
        case LOGOUT_USER:
        case SET_CURRENT_SUMMIT:
            return DEFAULT_STATE;
        default:
            return state;
    }
};

export default scheduleBuilderReducer;
