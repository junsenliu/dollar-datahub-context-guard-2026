"""Seed the local DataHub Quickstart with synthetic competition metadata only."""

from datahub.emitter.mce_builder import (
    make_data_platform_urn,
    make_dataset_urn,
    make_tag_urn,
    make_user_urn,
)
from datahub.emitter.mcp import MetadataChangeProposalWrapper
from datahub.emitter.rest_emitter import DatahubRestEmitter
from datahub.metadata.schema_classes import (
    CorpUserInfoClass,
    DatasetLineageTypeClass,
    DatasetPropertiesClass,
    GlobalTagsClass,
    OtherSchemaClass,
    OwnerClass,
    OwnershipClass,
    OwnershipTypeClass,
    SchemaFieldClass,
    SchemaFieldDataTypeClass,
    SchemaMetadataClass,
    StringTypeClass,
    TagAssociationClass,
    TagPropertiesClass,
    UpstreamClass,
    UpstreamLineageClass,
)

GMS_URL = "http://127.0.0.1:8080"
PLATFORM = "snowflake"
ENV = "PROD"
PII_TAG = make_tag_urn("PII")
OWNER = make_user_urn("data-platform-demo")


def dataset_urn(name: str) -> str:
    return make_dataset_urn(PLATFORM, name, ENV)


def field(name: str, *, pii: bool = False) -> SchemaFieldClass:
    return SchemaFieldClass(
        fieldPath=name,
        type=SchemaFieldDataTypeClass(type=StringTypeClass()),
        nativeDataType="VARCHAR",
        nullable=True,
        globalTags=(
            GlobalTagsClass(tags=[TagAssociationClass(tag=PII_TAG)]) if pii else None
        ),
    )


def emit(emitter: DatahubRestEmitter, urn: str, aspect: object) -> None:
    emitter.emit_mcp(MetadataChangeProposalWrapper(entityUrn=urn, aspect=aspect))


def emit_dataset(
    emitter: DatahubRestEmitter,
    *,
    name: str,
    description: str,
    fields: list[SchemaFieldClass],
    tags: list[str] | None = None,
    upstream: str | None = None,
) -> str:
    urn = dataset_urn(name)
    emit(
        emitter,
        urn,
        DatasetPropertiesClass(
            name=name,
            qualifiedName=name,
            description=description,
            customProperties={"demoData": "true", "source": "Dollar Data Context Guard"},
        ),
    )
    emit(
        emitter,
        urn,
        SchemaMetadataClass(
            schemaName=name,
            platform=make_data_platform_urn(PLATFORM),
            version=0,
            hash="synthetic-demo-v1",
            platformSchema=OtherSchemaClass(rawSchema="synthetic demo schema"),
            fields=fields,
        ),
    )
    emit(
        emitter,
        urn,
        OwnershipClass(
            owners=[OwnerClass(owner=OWNER, type=OwnershipTypeClass.DATAOWNER)]
        ),
    )
    if tags:
        emit(
            emitter,
            urn,
            GlobalTagsClass(tags=[TagAssociationClass(tag=make_tag_urn(tag)) for tag in tags]),
        )
    if upstream:
        emit(
            emitter,
            urn,
            UpstreamLineageClass(
                upstreams=[
                    UpstreamClass(dataset=upstream, type=DatasetLineageTypeClass.TRANSFORMED)
                ]
            ),
        )
    return urn


def main() -> None:
    emitter = DatahubRestEmitter(gms_server=GMS_URL)
    emitter.test_connection()

    emit(
        emitter,
        PII_TAG,
        TagPropertiesClass(
            name="PII",
            description="Synthetic PII classification used only by the Dollar competition demo.",
            colorHex="#B42318",
        ),
    )
    emit(
        emitter,
        make_tag_urn("Tier1"),
        TagPropertiesClass(
            name="Tier1",
            description="Synthetic high-importance asset marker for the competition demo.",
            colorHex="#B54708",
        ),
    )
    emit(
        emitter,
        OWNER,
        CorpUserInfoClass(
            active=True,
            displayName="Data Platform Demo Owner",
            email="data-platform@demo.invalid",
            title="Synthetic competition owner",
        ),
    )

    customer = emit_dataset(
        emitter,
        name="commerce.customer_profile",
        description="Synthetic canonical customer profile for retention and churn demonstrations.",
        fields=[
            field("customer_id"),
            field("email", pii=True),
            field("phone_number", pii=True),
            field("loyalty_tier"),
        ],
        tags=["PII", "Tier1"],
    )
    emit_dataset(
        emitter,
        name="commerce.product_events",
        description="Synthetic anonymous product interaction events.",
        fields=[field("event_id"), field("event_type"), field("occurred_at")],
    )
    customer_360 = emit_dataset(
        emitter,
        name="analytics.customer_360",
        description="Synthetic customer analytics aggregate.",
        fields=[field("customer_id"), field("retention_segment")],
        upstream=customer,
    )
    retention = emit_dataset(
        emitter,
        name="analytics.customer_retention_dashboard_source",
        description="Synthetic retention dashboard source.",
        fields=[field("customer_id"), field("retention_score")],
        upstream=customer_360,
    )
    emit_dataset(
        emitter,
        name="ml.customer_churn_features",
        description="Synthetic feature table for a churn model.",
        fields=[field("customer_id"), field("churn_probability")],
        upstream=retention,
    )

    print("Seeded synthetic DataHub assets and three-hop lineage successfully.")


if __name__ == "__main__":
    main()
