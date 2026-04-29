package com.greenculture.infrastructure.seoul;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@JacksonXmlRootElement(localName = "culturalEventInfo")
public class CulturalEventInfoXml {

    @JacksonXmlProperty(localName = "list_total_count")
    private Integer listTotalCount;

    @JacksonXmlProperty(localName = "RESULT")
    private ResultXml result;

    @JacksonXmlElementWrapper(useWrapping = false)
    @JacksonXmlProperty(localName = "row")
    private List<RowXml> rows;

    @Getter
    @Setter
    @NoArgsConstructor
    public static class ResultXml {
        @JacksonXmlProperty(localName = "CODE")
        private String code;

        @JacksonXmlProperty(localName = "MESSAGE")
        private String message;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RowXml {
        @JacksonXmlProperty(localName = "CODENAME")
        private String codeName;

        @JacksonXmlProperty(localName = "TITLE")
        private String title;

        @JacksonXmlProperty(localName = "PLACE")
        private String place;

        @JacksonXmlProperty(localName = "STRTDATE")
        private String startDateTime;

        @JacksonXmlProperty(localName = "END_DATE")
        private String endDateTime;

        @JacksonXmlProperty(localName = "LAT")
        private String lat;

        @JacksonXmlProperty(localName = "LOT")
        private String lot;

        @JacksonXmlProperty(localName = "HMPG_ADDR")
        private String homepage;

        @JacksonXmlProperty(localName = "ORG_LINK")
        private String orgLink;

        @JacksonXmlProperty(localName = "GUNAME")
        private String guName;

        @JacksonXmlProperty(localName = "RGSTDATE")
        private String registerDate;
    }
}

