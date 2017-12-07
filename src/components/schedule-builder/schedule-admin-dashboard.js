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
import React from 'react';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { connect } from 'react-redux';
import {
    getUnScheduleEventsPage,
    publishEvent,
    changeCurrentSelectedDay,
    changeCurrentSelectedLocation,
    getPublishedEventsBySummitDayLocation,
    changeCurrentEventType,
    changeCurrentTrack,
    changeCurrentPresentationSelectionStatus,
    changeCurrentUnscheduleSearchTerm
} from '../../actions/summit-builder-actions';
import UnScheduleEventList from './unschedule-event-list';
import ScheduleEventList from './schedule-event-list';
import SummitEvent from '../../models/summit-event';
import { DefaultEventMinutesDuration, PixelsPerMinute } from '../../constants';
import ScheduleAdminDaySelector from './schedule-admin-day-selector';
import ScheduleAdminVenueSelector from './schedule-admin-venue-selector';
import ScheduleAdminEventTypeSelector from './schedule-admin-event-type-selector';
import ScheduleAdminTrackSelector from './schedule-admin-track-selector';
import ScheduleAdminPresentationSelectionStatusSelector from './schedule-admin-presentation-selection-status-selector';
import ScheduleAdminSearchFreeTextUnScheduleEvents from './schedule-admin-search-free-text-unschedule-events';
import T from "i18n-react/dist/i18n-react";
import moment from 'moment-timezone';
import FragmentParser from '../../utils/fragmen-parser';
import * as Scroll from 'react-scroll';

class ScheduleAdminDashBoard extends React.Component {

    constructor(props) {
        super(props);
        this.onScheduleEvent = this.onScheduleEvent.bind(this);
        this.onScheduleEventWithDuration = this.onScheduleEventWithDuration.bind(this);
        this.onDayChanged = this.onDayChanged.bind(this);
        this.onVenueChanged = this.onVenueChanged.bind(this);
        this.onUnScheduleEventsPageChange = this.onUnScheduleEventsPageChange.bind(this);
        this.onEventTypeChanged = this.onEventTypeChanged.bind(this);
        this.onTrackChanged = this.onTrackChanged.bind(this);
        this.onPresentationSelectionStatusChanged = this.onPresentationSelectionStatusChanged.bind(this);
        this.onUnscheduledEventsFilterTextChanged = this.onUnscheduledEventsFilterTextChanged.bind(this);
        this.fragmentParser = new FragmentParser();
        this.filters        = this.parseFilterFromFragment();
        this.timeoutHandler = null;
    }

    parseFilterFromFragment(){
        // read url hash and redirect to event
        let { currentSummit } = this.props;
        if(currentSummit == null) return;
        var hash =this.fragmentParser.getParams();
        var filters = {};
        for(let key in hash) {
            let value = hash[key];
            switch(key) {
                case 'day':
                    filters['currentDay'] = value;
                    break;
                case 'location_id':
                    let location = currentSummit.locations.filter((location) => location.id == value).shift()
                    if(location) {
                        filters['currentLocation'] = location;
                    }
                    break;
                case 'event':
                        filters['currentEvent'] = value;
                    break;
                case 'time':
                    filters['currentTime'] = value;
                    break;
                case 'q':

                    break;
            }
        }
        return filters;
    }

    componentDidMount(){

        let { currentSummit, currentEventType, currentTrack, currentPresentationSelectionStatus, currentDay, currentLocation } = this.props;
        if(currentSummit == null) return;

        let eventTypeId = currentEventType == null ? null : currentEventType.id;
        let trackId     = currentTrack == null ? null : currentTrack.id;
        this.props.getUnScheduleEventsPage(currentSummit.id, 1, 10, eventTypeId, trackId, currentPresentationSelectionStatus);

        if(this.filters.hasOwnProperty('currentDay')) {
            currentDay = this.filters['currentDay'];
            this.props.changeCurrentSelectedDay(currentDay);
        }

        if(this.filters.hasOwnProperty('currentLocation')) {
            currentLocation = this.filters['currentLocation'];
            this.props.changeCurrentSelectedLocation(currentLocation);
        }

        this.updatePublishedList(currentDay, currentLocation);

    }

    updatePublishedList(day, location){
        let { currentSummit } = this.props;
        if( day != null && location != null)
            this.props.getPublishedEventsBySummitDayLocation
            (
                currentSummit,
                day,
                location
            );
    }

    componentWillMount () {
    }

    componentWillUpdate(nextProps, nextState) {
    }

    onScheduleEvent(event, currentDay, startDateTime){
        let eventModel = new SummitEvent(event, this.props.currentSummit);
        this.props.publishEvent(event, currentDay, startDateTime, eventModel.getMinutesDuration());
    }

    componentWillReceiveProps(nextProps){

    }

    onDayChanged(day){
        let { currentLocation } = this.props;
        this.props.changeCurrentSelectedDay(day);
        let locationId = currentLocation != null ? currentLocation.id: null;
        this.buildFragment(locationId, day);
        this.filters  = this.parseFilterFromFragment();
        this.updatePublishedList(day, currentLocation);
    }

    onVenueChanged(location){
        let { currentDay } = this.props;
        this.props.changeCurrentSelectedLocation(location);
        this.buildFragment(location.id, currentDay);
        this.filters  = this.parseFilterFromFragment();
        this.updatePublishedList(currentDay, location);
    }

    onUnScheduleEventsPageChange(currentPage){
        let { summit } = this.props;
        this.props.getUnScheduleEventsPage(summit.id, currentPage);
    }

    onEventTypeChanged(eventType){
        let { summit, currentTrack, currentPresentationSelectionStatus, unScheduleEventsCurrentSearchTerm} = this.props;
        let trackId = currentTrack == null ? null : currentTrack.id;
        let eventTypeId = eventType == null ? null : eventType.id;
        this.props.changeCurrentEventType(eventType);
        this.props.getUnScheduleEventsPage(summit.id, 1, 10, eventTypeId, trackId, currentPresentationSelectionStatus, unScheduleEventsCurrentSearchTerm);
    }

    onTrackChanged(track){
        let { summit, currentEventType , currentPresentationSelectionStatus, unScheduleEventsCurrentSearchTerm} = this.props;
        let eventTypeId = currentEventType == null ? null : currentEventType.id;
        let trackId     = track == null ? null : track.id;
        this.props.changeCurrentTrack(track);
        this.props.getUnScheduleEventsPage(summit.id, 1, 10, eventTypeId, trackId, currentPresentationSelectionStatus, unScheduleEventsCurrentSearchTerm);
    }

    onPresentationSelectionStatusChanged(presentationSelectionStatus){
        let { summit, currentEventType, currentTrack, unScheduleEventsCurrentSearchTerm } = this.props;
        let eventTypeId = currentEventType == null ? null : currentEventType.id;
        let trackId = currentTrack == null ? null : currentTrack.id;
        this.props.changeCurrentPresentationSelectionStatus(presentationSelectionStatus);
        this.props.getUnScheduleEventsPage(summit.id, 1, 10, eventTypeId, trackId, presentationSelectionStatus, unScheduleEventsCurrentSearchTerm);
    }

    onUnscheduledEventsFilterTextChanged(term){
        let { summit, currentEventType, currentTrack, currentPresentationSelectionStatus} = this.props;
        let eventTypeId = currentEventType == null ? null : currentEventType.id;
        let trackId    = currentTrack == null ? null : currentTrack.id;
        this.props.changeCurrentUnscheduleSearchTerm(term)
        this.props.getUnScheduleEventsPage(summit.id, 1, 10, eventTypeId, trackId, currentPresentationSelectionStatus, term);
    }

    onScheduleEventWithDuration(event, currentDay, startTime, duration){
        this.props.publishEvent
        (
            event,
            currentDay,
            startTime,
            duration
        );
    }

    buildFragment(locationId = null, day = null) {

        this.fragmentParser.setParam('q','');
        this.fragmentParser.setParam('day','');
        this.fragmentParser.setParam('location_id','');
        this.fragmentParser.setParam('event','');
        this.fragmentParser.setParam('time','');

        if(locationId != null ){
            this.fragmentParser.setParam('location_id', locationId)
        }

        if(day != null ){
            this.fragmentParser.setParam('day', day)
        }

        window.location.hash = this.fragmentParser.serialize();
    }

    componentDidUpdate(){
        console.log("componentDidUpdate");
        if(this.timeoutHandler != null){
            window.clearTimeout(this.timeoutHandler)
        }
        this.timeoutHandler =  window.setTimeout(() => {
            if (this.filters.hasOwnProperty('currentTime')) {
                let time = this.filters['currentTime'];
                this.scrollToElement(time);
            }

            if (this.filters.hasOwnProperty('currentEvent')) {
                let eventId = this.filters['currentEvent'];
                this.scrollToElement(`event_${eventId}`);
            }
        }, 2000);
    }


    scrollToElement(elementId) {

        var el = document.getElementById(elementId);
        if(!el) return;
        let yPos = el.getClientRects()[0].top;
        var scroll = Scroll.animateScroll;

        scroll.scrollTo(yPos, {
            duration: 1500,
            delay: 100,
            smooth: "easeInOutQuint",
        });
    }

    render(){

        let {
            scheduleEvents,
            unScheduleEvents,
            childScheduleEvents,
            currentSummit,
            currentDay,
            currentLocation,
            unScheduleEventsCurrentPage,
            unScheduleEventsLasPage,
            currentEventType,
            currentTrack,
            currentPresentationSelectionStatus,
            unScheduleEventsCurrentOrder,
            unScheduleEventsCurrentSearchTerm
        } = this.props;

        if(currentSummit == null ) return null;


        // parse summits dates
        let days = [];

        let summitLocalStartDate     = moment(currentSummit.start_date * 1000).tz(currentSummit.time_zone.name);
        let summitLocalEndDate       = moment(currentSummit.end_date * 1000).tz(currentSummit.time_zone.name);
        let currentAuxDay            = summitLocalStartDate.clone();
        let currentDaySelectorItem   = null;
        let currentVenueSelectorItem = null;
        let currentTrackSelectorItem = null;
        let currentEventTypeSelectorItem = null;

        do{
            let option = { value: currentAuxDay.format("YYYY-MM-DD") , label: currentAuxDay.format('MMMM Do YYYY') };
            if(currentDay != null && currentAuxDay.format("YYYY-MM-DD") == currentDay)
                currentDaySelectorItem = option;
            days.push(option);
            currentAuxDay = currentAuxDay.clone();
            currentAuxDay.add(1, 'day');
        } while(!currentAuxDay.isAfter(summitLocalEndDate));


        // parse summit venues
        let venues = [];
        for(let i = 0; i < currentSummit.locations.length; i++) {
            let location = currentSummit.locations[i];
            if (location.class_name != "SummitVenue") continue;
            let option = { value : location, label: location.name };
            if(currentLocation != null && location.id == currentLocation.id)
                currentVenueSelectorItem = option;
            venues.push(option);
            for(let j = 0; j < location.rooms.length ; j++){
                let subOption = { value : location.rooms[j] , label: location.rooms[j].name};
                if(currentLocation != null && location.rooms[j].id == currentLocation.id)
                    currentVenueSelectorItem = subOption;
                venues.push(subOption);
            }
        }

        // parse event types

        let eventTypes = [];

        for(let i = 0; i < currentSummit.event_types.length; i++) {
            let event_type = currentSummit.event_types[i];
            let option = { value : event_type, label: event_type.name };
            if(currentEventType != null && currentEventType.id == event_type.id)
                currentEventTypeSelectorItem = option;
            eventTypes.push(option);
        }

        // parse tracks

        let tracks = [];

        for(let i = 0; i < currentSummit.tracks.length; i++) {
            let track = currentSummit.tracks[i];
            let option = { value : track, label: track.name };
            if(currentTrack != null && currentTrack.id == track.id)
                currentTrackSelectorItem = option;
            tracks.push(option);
        }

        // presentation selection status

        let presentationSelectionStatus = [
            { value : 'selected', label: 'Selected' },
            { value : 'accepted', label:  'Accepted' },
            { value : 'alternate', label: 'Alternate'},
            { value : 'lightning-accepted', label: 'Lightning Accepted' },
            { value : 'lightning-alternate', label: 'Lightning Alternate' },
        ];

        return(
            <div className="row schedule-app-container no-margin">
                <div className="col-md-6 published-container">
                    <ScheduleAdminDaySelector onDayChanged={this.onDayChanged} days={days} currentValue={ currentDaySelectorItem }/>
                    <ScheduleAdminVenueSelector onVenueChanged={this.onVenueChanged} venues={venues} currentValue={ currentVenueSelectorItem } />
                    { currentDay != null && currentLocation != null &&
                        <ScheduleEventList
                        startTime={"07:00"}
                        endTime={"22:00"}
                        currentSummit={currentSummit}
                        interval={DefaultEventMinutesDuration}
                        currentDay={currentDay}
                        pixelsPerMinute={PixelsPerMinute}
                        onScheduleEvent={this.onScheduleEvent}
                        onScheduleEventWithDuration={this.onScheduleEventWithDuration}
                        events={scheduleEvents}
                        childEvents={childScheduleEvents}/>
                    }
                    { (currentDay == null || currentLocation == null) &&
                    <p className="empty-list-message">{T.translate("errors.empty_list_schedule_events")}</p>
                    }
                </div>
                <div className="col-md-6 unpublished-container">
                    <ScheduleAdminSearchFreeTextUnScheduleEvents
                        onFilterTextChange={this.onUnscheduledEventsFilterTextChanged}
                        currentValue={unScheduleEventsCurrentSearchTerm}
                    />
                    <ScheduleAdminEventTypeSelector
                        onEventTypeChanged={this.onEventTypeChanged}
                        eventTypes={eventTypes}
                        currentValue={currentEventTypeSelectorItem}
                    />
                    <ScheduleAdminTrackSelector
                        onTrackChanged={this.onTrackChanged}
                        tracks={tracks}
                        currentValue={currentTrackSelectorItem}
                        />
                    { currentEventType != null && currentEventType.class_name == "PresentationType" &&

                        <ScheduleAdminPresentationSelectionStatusSelector
                            presentationSelectionStatus={presentationSelectionStatus}
                            onPresentationSelectionStatusChanged={this.onPresentationSelectionStatusChanged}
                            currentValue={currentPresentationSelectionStatus}
                        />
                    }
                   <UnScheduleEventList
                            events={unScheduleEvents}
                            currentPage={unScheduleEventsCurrentPage}
                            lastPage={unScheduleEventsLasPage}
                            onPageChange={this.onUnScheduleEventsPageChange}/>
                </div>
            </div>
        );
    }
}

ScheduleAdminDashBoard = DragDropContext(HTML5Backend)(ScheduleAdminDashBoard);

function mapStateToProps({ currentScheduleBuilderState, currentSummitState  }) {
    return {
        scheduleEvents                     : currentScheduleBuilderState.scheduleEvents,
        unScheduleEvents                   : currentScheduleBuilderState.unScheduleEvents,
        childScheduleEvents                : currentScheduleBuilderState.childScheduleEvents,
        currentSummit                      : currentSummitState.currentSummit,
        currentDay                         : currentScheduleBuilderState.currentDay,
        currentLocation                    : currentScheduleBuilderState.currentLocation,
        currentEventType                   : currentScheduleBuilderState.currentEventType,
        currentTrack                       : currentScheduleBuilderState.currentTrack,
        unScheduleEventsCurrentPage        : currentScheduleBuilderState.unScheduleEventsCurrentPage,
        unScheduleEventsLasPage            : currentScheduleBuilderState.unScheduleEventsLasPage,
        unScheduleEventsCurrentOrder       : currentScheduleBuilderState.unScheduleEventsCurrentOrder,
        currentPresentationSelectionStatus : currentScheduleBuilderState.currentPresentationSelectionStatus,
        unScheduleEventsCurrentSearchTerm  : currentScheduleBuilderState.unScheduleEventsCurrentSearchTerm,
    }
}

export default connect(mapStateToProps, {
    getUnScheduleEventsPage,
    publishEvent,
    changeCurrentSelectedDay,
    changeCurrentSelectedLocation,
    getPublishedEventsBySummitDayLocation,
    changeCurrentEventType,
    changeCurrentTrack,
    changeCurrentPresentationSelectionStatus,
    changeCurrentUnscheduleSearchTerm
})(ScheduleAdminDashBoard);